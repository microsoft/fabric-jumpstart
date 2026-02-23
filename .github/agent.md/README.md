# Agent bootstrapping

```bash
cat << 'EOF' > $HOME/.copilot/mcp-config.json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }
  }
}
EOF

cat $HOME/.copilot/mcp-config.json
```