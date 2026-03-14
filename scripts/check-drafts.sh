#!/usr/bin/env bash
# 检查 posts/ 下所有 *.md 文件的 published 字段
# 若 published 不为 true，则移动到 posts/draft/

set -euo pipefail

POSTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/posts"
DRAFT_DIR="$POSTS_DIR/draft"

moved=0

for file in "$POSTS_DIR"/*.md; do
  [ -f "$file" ] || continue

  # 提取 frontmatter 中的 published 值
  published=$(awk '/^---$/{n++; next} n==1 && /^published:/{sub(/^published:[[:space:]]*/, ""); print; exit}' "$file")

  if [ "$published" != "true" ]; then
    mkdir -p "$DRAFT_DIR"
    filename=$(basename "$file")
    mv "$file" "$DRAFT_DIR/$filename"
    echo "moved: $filename"
    moved=$((moved + 1))
  fi
done

echo "done. moved $moved file(s) to posts/draft/"
