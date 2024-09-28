# Kikoune

Discordのアクティビティで動く、Kiite Cafe風にニコニコ動画を同時再生するアプリ。

## コマンド

```bash
# Redis起動
docker-compose up -d redis

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# チェック
pnpm lint
pnpm typecheck
```

## URLマッピング

| Prefix                                                  | URL                                       |
| ------------------------------------------------------- | ----------------------------------------- |
| `/external/{subsubsub}--{subsub}--{sub}--{main}--{tld}` | `{subsubsub}.{subsub}.{sub}.{main}.{tld}` |
| `/external/{subsub}--{sub}--{main}--{tld}`              | `{subsub}.{sub}.{main}.{tld}`             |
| `/external/{sub}--{main}--{tld}`                        | `{sub}.{main}.{tld}`                      |
| `/`                                                     | `your-domain.example.com`                 |

## ライセンス

MIT Licenseで公開されています。詳しくは[LICENSE](LICENSE)を参照してください。
