#!/usr/bin/env bash
# 检查 posts/ 下所有文章包的 published 字段
# 若 published 不为 true，则将整个文章包移动到 posts/draft/

set -euo pipefail

POSTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/posts"
DRAFT_DIR="$POSTS_DIR/draft"

moved=0

for entry in "$POSTS_DIR"/*; do
  [ -e "$entry" ] || continue
  [ "$(basename "$entry")" != "draft" ] || continue

  file=""
  target=""

  if [ -d "$entry" ] && [ -f "$entry/index.md" ]; then
    file="$entry/index.md"
    target="$DRAFT_DIR/$(basename "$entry")"
  elif [ -f "$entry" ] && [[ "$entry" == *.md ]]; then
    slug="$(basename "$entry" .md)"
    file="$entry"
    target="$DRAFT_DIR/$slug"
  else
    continue
  fi

  # 提取 frontmatter 中的 published 值
  published=$(awk '/^---$/{n++; next} n==1 && /^published:/{sub(/^published:[[:space:]]*/, ""); print; exit}' "$file")

  if [ "$published" != "true" ]; then
    mkdir -p "$DRAFT_DIR"
    if [ -e "$target" ]; then
      echo "skip: $(basename "$target") already exists in posts/draft/" >&2
      continue
    fi

    if [ -d "$entry" ]; then
      mv "$entry" "$target"
    else
      mkdir -p "$target"
      mv "$entry" "$target/index.md"
      if [ -d "$POSTS_DIR/$slug.assets" ]; then
        mv "$POSTS_DIR/$slug.assets" "$target/assets"
      fi
    fi

    echo "moved: $(basename "$target")"
    moved=$((moved + 1))
  fi
done

echo "done. moved $moved post package(s) to posts/draft/"
