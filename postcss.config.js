cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
EOF