# GACP-ERP Landing Page

Modern landing page for the GACP-ERP medical cannabis production management system.

## 🚀 Features

- **Modern Design** - Clean, professional interface
- **Fully Responsive** - Works great on all devices
- **Contact Form** - Integrated request submission form
- **Animations** - Smooth transitions and scroll effects
- **SEO Optimized** - Proper structure and meta tags
- **No Dependencies** - Pure HTML, CSS, JavaScript

## 📋 Structure

```text
landing/
├── index.html      # Main HTML page
├── styles.css      # Styles and responsive design
├── script.js       # JavaScript functionality
└── README.md       # This documentation
```

## 🎨 Sections

1. **Hero** - Main banner with brief description and CTA
2. **Features** - Key system capabilities (9 cards)
3. **Compliance** - Standards compliance and certifications
4. **Benefits** - Advantages of using GACP-ERP
5. **Demo** - Demo video section (placeholder)
6. **Contact** - Contact form for requests
7. **Footer** - Navigation and contact information

## 🔧 Usage

### Local Launch

Simply open `index.html` in your browser:

```bash
# Navigate to directory
cd /home/noise83/Projects/GACP-ERP/landing

# Open in browser (Linux)
xdg-open index.html

# Or run local server (if Python is installed)
python3 -m http.server 8000
# Then open http://localhost:8000
```

### Form Integration

By default, the form uses simulated submission. To connect to a real API:

1. Open `script.js`
2. Find the `simulateApiCall(data)` function
3. Replace simulation with actual fetch request:

```javascript
function submitForm(data) {
    return fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json());
}
```

## 🎯 Configuration

### Colors

Main colors are defined in CSS variables in `styles.css`:

```css
:root {
    --primary-color: #10B981;      /* Primary green */
    --primary-dark: #059669;       /* Dark green */
    --secondary-color: #3B82F6;    /* Blue accent */
    /* ... other colors */
}
```

### Contact Information

Update contact details in the `#contact` section in `index.html`:

- Email
- Phone
- Office address

### Adding Video

Replace placeholder in `#demo` section:

```html
<iframe 
    width="100%" 
    height="500" 
    src="https://www.youtube.com/embed/YOUR_VIDEO_ID" 
    frameborder="0" 
    allowfullscreen>
</iframe>
```

## 📱 Responsiveness

Landing page is fully adapted for:

- **Desktop** (1200px+)
- **Tablet** (768px - 1024px)
- **Mobile** (up to 768px)

Main breakpoints:

- 1024px - Hide hero image
- 768px - Mobile menu
- 480px - Small mobile devices

## 🔒 Security

For production use:

1. Add CSRF protection for the form
2. Configure rate limiting for API
3. Validate data on server side
4. Use HTTPS
5. Add Google reCAPTCHA for bot protection

## 🚀 Performance Optimization

For better performance:

1. Minify CSS and JS:

```bash
# Use tools like:
npm install -g clean-css-cli uglify-js

# Minify CSS
cleancss -o styles.min.css styles.css

# Minify JS
uglifyjs script.js -o script.min.js
```

2. Optimize images
3. Use CDN for static files
4. Configure server-side caching

## 📊 Analytics

Add analytics code before the closing `</body>` tag:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🎨 Customization

### Fonts

By default, Inter from Google Fonts is used. To replace:

```html
<!-- In <head> -->
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap" rel="stylesheet">
```

```css
/* In styles.css */
body {
    font-family: 'YOUR_FONT', sans-serif;
}
```

### Logo

Replace the SVG logo in header with your own:

```html
<div class="logo">
    <img src="path/to/logo.svg" alt="GACP-ERP">
    <span>GACP-ERP</span>
</div>
```

## 📧 Contact Form

Form fields:

- **Name** (required)
- **Company** (required)
- **Email** (required, with validation)
- **Phone** (optional, with formatting)
- **Position** (optional)
- **Area of Interest** (select)
- **Message** (textarea)
- **Data Processing Consent** (required checkbox)

## 🌐 SEO

Update meta tags in `<head>`:

```html
<meta name="description" content="Your description">
<meta name="keywords" content="your, keywords">
<meta property="og:title" content="GACP-ERP">
<meta property="og:description" content="Description">
<meta property="og:image" content="url-to-image">
```

## 📄 License

This landing page is part of the GACP-ERP project.

## 🤝 Support

For questions and suggestions:

- Email: info@gacp-erp.com
- Create an issue in the project repository

---

**Version:** 1.0.0  
**Created:** October 17, 2025  
**Author:** GACP-ERP Team
