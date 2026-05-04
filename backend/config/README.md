# Product Configuration

## Overview

This directory contains configuration files for your product information. The AI assistant uses these details to answer customer questions accurately.

## Files

### `product_info.py`

This is the main configuration file where **YOU (the developer/business owner)** define your product details.

## What You Need to Fill In

### 1. Basic Information
```python
"name": "SupportAI",  # Your product name
"tagline": "AI-Powered Customer Support Platform",  # Short tagline
"main_benefit": "AI-powered customer support automation",  # What does your product do?
```

### 2. Description
```python
"description": """
    Write a 2-3 sentence description of what your product does
    and who it's for.
"""
```

### 3. Features
```python
"features": [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    # Add all your key features
]
```

### 4. Pricing Plans
```python
"pricing": {
    "starter": {
        "name": "Starter",
        "price": "$29/month",  # Your actual price
        "features": [...],      # Features included
        "best_for": "Small businesses"
    },
    # Add your other plans
}
```

### 5. Contact Information
```python
"contact": {
    "sales_email": "sales@yourcompany.com",  # Your real email
    "support_email": "support@yourcompany.com",
    "phone": "+1 (555) 123-4567",  # Your real phone
    "website": "https://yourcompany.com"
}
```

## How It Works

1. **You edit** `product_info.py` with your actual product details
2. **The AI reads** this configuration when it starts
3. **Customers ask** questions like "What are your pricing plans?"
4. **The AI answers** using the information you configured

## Example Customer Interaction

**After you configure:**
```python
"pricing": {
    "starter": {
        "price": "$29/month",
        ...
    }
}
```

**Customer asks:**
> "How much does your Starter plan cost?"

**AI responds:**
> "Our Starter plan is $29/month and includes up to 1,000 conversations, 1 AI assistant, and basic analytics. It's perfect for small businesses and startups!"

## Important Notes

- ✅ **You fill this in ONCE** during setup
- ✅ **End users NEVER see** this file
- ✅ **The AI uses** this information automatically
- ✅ **You can update** anytime by editing the file and restarting the backend

## Quick Start

1. Open `product_info.py`
2. Replace all placeholder text with your actual product details
3. Save the file
4. Restart your backend server
5. Test by asking the AI about your product

## Testing Your Configuration

After updating, test with these questions:
- "What are your pricing plans?"
- "What features do you offer?"
- "How can I contact sales?"
- "Do you offer a free trial?"

The AI should respond with YOUR configured information.

## Need Help?

If you're unsure what to put in any field, think about:
- What would you tell a customer on a sales call?
- What's on your website's pricing page?
- What makes your product unique?

Use that information to fill in the configuration!
