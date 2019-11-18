<template>
  <div class="blog-content" v-html="getHtml">
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import marked from 'marked'
import 'highlight.js/scss/monokai-sublime.scss'
import highlightjs from 'highlight.js'

marked.setOptions({
  // code要素にdefaultで付くlangage-を削除
  langPrefix: '',
  // highlightjsを使用したハイライト処理を追加
  highlight (code, lang) {
    return highlightjs.highlightAuto(code, [lang]).value
  }
})

@Component({
  layout: 'blog'
})
export default class Blog extends Vue {
  md = `
# AWS CLIとjqコマンドでRoute53のレコードを一括で更新する

AWS CLIでRoute53のレコードを更新するは以下で紹介されています。

https://aws.amazon.com/jp/premiumsupport/knowledge-center/simple-resource-record-route53-cli/

今回は上記に加えて、既存のRoute53のレコードを一括更新するやり方を紹介していきます。

## 環境

- aws-cli/1.16.144 Python/3.7.3 Darwin/17.7.0 botocore/1.12.134
- jq - commandline JSON processor [version 1.6]

※それぞれのインストール方法は割愛します。

## Situation

今回DNSサーバの切り替えとして、とあるDNSサーバからRoute53へと切り替えを行いました。

その際、何かしらのトラブルが起きた場合にはなるべく早く戻せるように、
TTLをすべて60秒にしてRoute53にレコード作成しました。

その後切り替えを行い、トラブルもなく安定しているため各レコードのTTLを300/900/172800に一括で変更することとなりました。

ゾーンファイルに対応していれば、簡単に変更できるのですが、Route53は初回インポート以外でゾーンファイルには対応していない模様。。。

なので今回はaws cliとjqコマンドを使っていきます。

## 既存レコードの確認

以下の \`aws route53 list-resource-record-sets\` で既存のレコードを確認します。(※xxxxxxxxxxの部分は任意、以下略)

\`\`\`bash
aws --profile xxxxxxxxxx route53 list-resource-record-sets --hosted-zone-id xxxxxxxxxx
\`\`\`

コマンド実行後、下記のような既存のレコードがJSONで返ってきます。

\`\`\`json
{
  "ResourceRecordSets": [
    {
      "Name": "yaizuuuu.com.",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "xxxxxxxxxx.cloudfront.net.",
        "EvaluateTargetHealth": false
      }
    },
    {
      "Name": "yaizuuuu.com.",
      "Type": "MX",
      "TTL": 60,
      "ResourceRecords": [
        {
          "Value": "10 xxxxxxxxxx"
        }
      ]
    },
    {
      "Name": "yaizuuuu.com.",
      "Type": "SOA",
      "TTL": 60,
      "ResourceRecords": [
        {
          "Value": "xxxxxxxxxx.com. xxxxxxxxxx.com. 1 7200 900 1209600 86400"
        }
      ]
    },
    ....(略)
  ]
}
\`\`\`

上記のJSONをRoute53のレコードを更新するフォーマットに合わせて出力したいです。

以下は公式サイトでも紹介されるJSONを少し書き換えたRoute53のレコードをUPSERT(※後述)するためのフォーマットになります。

\`\`\`json
{
  "Comment": "UPSERT TTL of records",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "yaizuuuu.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "x.x.x.x"
          }
        ]
      }
    }
  ]
}
\`\`\`

Changes[].ResourceRecordSetの中に \`aws route53 list-resource-record-sets\` で取得したレコードの情報を入れつつ、
TTLの値を任意の値に変更したいです。

ちなみに、Changes.ActionにはCREATE・DELETE・UPSERTがあり、それぞれの挙動は以下になります。

- CREATE: 新規作成
- DELETE: 削除
- UPSERT: レコードが存在しなければ新規作成、存在すれば更新

詳細な情報は以下のURLを参照してください。

https://aws.amazon.com/jp/premiumsupport/knowledge-center/simple-resource-record-route53-cli/

今回は \`aws route53 list-resource-record-sets\` で取得した内容をjqコマンドで上記のフォーマットに変更したいと思います。

## レコード変更用JSONファイルの作成

結論から言うと、以下のようなコマンドになりました。

\`\`\`bash
aws --profile xxxxxxxxxx route53 list-resource-record-sets --hosted-zone-id xxxxxxxxxx \\
  | jq '{ "Action": "UPSERT", ResourceRecordSet: .ResourceRecordSets[] }' \\
  | jq -s '{ "Changes": ., Comment: "UPSERT TTL of records" }' \\
  | jq '(.Changes[] | select(.ResourceRecordSet.TTL == 60) | .ResourceRecordSet.TTL) |= 300' \\
  | jq '(.Changes[] | select(.ResourceRecordSet.Type == "SOA") | .ResourceRecordSet.TTL) |= 900' \\
  | jq '(.Changes[] | select(.ResourceRecordSet.Type == "NS") | .ResourceRecordSet.TTL) |= 172800' > update-route53-record.json
\`\`\`

ここから少しjqコマンドの解説を加えます。jqコマンドで \`.ResourceRecordSets[]\` を指定することによって、
既存のRoute53のレコードのオブジェクトを抜き出すことができます。

\`\`\`bash
# .ResourceRecordSets[]を指定して、取得した既存のレコードのオブジェクトを一行ずつ取得できる
aws --profile xxxxxxxxxx route53 list-resource-record-sets --hosted-zone-id xxxxxxxxxx \\
  | jq -c '.ResourceRecordSets[]'

# jsの\`-c\`オプションは改行をせずコンパクトに表示できるので、解説用に付け加えています
\`\`\`

抜き出したレコードのオブジェクトをもとにフォーマットにあったオブジェクトを再構築します。

\`\`\`bash
# Actionに"UPSERT"、ResourceRecordSetに抜き出した\`.ResourceRecordSets[]\`をセットしてオブジェクトを再構築
aws --profile xxxxxxxxxx route53 list-resource-record-sets --hosted-zone-id xxxxxxxxxx \\
  | jq -c '{ "Action": "UPSERT", ResourceRecordSet: .ResourceRecordSets[] }'
\`\`\`

ここからパイプラインでjqコマンドをもう一つ追加し、再構築した一行ずつのオブジェクト配列として受け取るために \`-s\` オプションを指定します。
再構築したオブジェクトを \`Changes\` の中にアサインしつつ、さらなるオブジェクトの再構築を行います。

\`\`\`bash
# 再構築した一行ずつのオブジェクトを \`-s\` オプションで配列として受け取れる
# Changesの中に再構築したオブジェクトをアサイン
aws --profile xxxxxxxxxx route53 list-resource-record-sets --hosted-zone-id xxxxxxxxxx \\
  | jq -c '{ "Action": "UPSERT", ResourceRecordSet: .ResourceRecordSets[] }' \\
  | jq -s '{ "Changes": ., Comment: "UPSERT TTL of records" }'

# 見やすいように \`-c\` オプションを指定しましたが、ここからはなくても大丈夫
\`\`\`

jqコマンドでTTLの値の更新も行っていきます。

jqコマンドではselectでオブジェクトを絞り込む事ができ、 \`key |= value\` で値の変更をすることできます。

それらを活用して、デフォルトのTTLを300・SOAレコードのTTLを900・NSレコードのTTLを172800に変更します。

\`\`\`bash
# Changes[]の中に含まれる.ResourceRecordSet.TTLが60の場合、300に変更
# Changes[]の中に含まれる.ResourceRecordSet.TypeがSOA or NSの場合、900 or 172800に変更
aws --profile xxxxxxxxxx route53 list-resource-record-sets --hosted-zone-id xxxxxxxxxx \\
  | jq '{ "Action": "UPSERT", ResourceRecordSet: .ResourceRecordSets[] }' \\
  | jq -s '{ "Changes": ., Comment: "UPSERT TTL of records" }' \\
  | jq '(.Changes[] | select(.ResourceRecordSet.TTL == 60) | .ResourceRecordSet.TTL) |= 300' \\
  | jq '(.Changes[] | select(.ResourceRecordSet.Type == "SOA") | .ResourceRecordSet.TTL) |= 900' \\
  | jq '(.Changes[] | select(.ResourceRecordSet.Type == "NS") | .ResourceRecordSet.TTL) |= 172800' > update-route53-record.json

# 加工した結果を任意のJSONファイル(update-route53-record.json)に出力して確認
\`\`\`

## レコードの更新

生成されたファイルに間違ったところがないか確認をして、問題なければ更新です。

更新は以下のコマンドから行います。(※以下のコマンドはJSONファイルと同じディレクトリで実行)

\`\`\`bash
aws --profile xxxxxxxxxx route53 change-resource-record-sets --hosted-zone-id xxxxxxxxxx --change-batch file://update-route53-record.json
\`\`\`

以上！

jqコマンドを使えば、\`aws route53 list-resource-record-sets\` で取得した内容を簡単に整形できるため、
今回のようにサッとRoute53の更新用のフォーマットに変更することができました！
`

  get getHtml (): string {
    const tempElement = document.createElement('div')
    tempElement.innerHTML = marked(this.md)
    const codeBlocks = tempElement.querySelectorAll('pre')
    codeBlocks.forEach((el) => {
      el.classList.add('hljs')
    })

    return tempElement.innerHTML
  }
}
</script>

<style lang="scss">
.blog-content {
  h1 {
    margin-bottom: 40px;
  }

  h2 {
    padding-top: 10px;
    margin-bottom: 30px;
    border-bottom: 1px solid #ddd;
  }

  ul, pre {
    margin-bottom: 30px;
  }

  pre {
    border-radius: 6px;
    padding: 15px;
  }

  pre code {
    display: block;
    width: 100%;
  }

  p {
    margin-bottom: 20px;
  }

  pre code {
    background-color: transparent;
    box-shadow: none;
  }

  .hljs code {
    color: #f8f8f2;

    &::before {
      content: "";
    }
  }
}
</style>
