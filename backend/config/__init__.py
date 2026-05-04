"""
Configuration module for product information.
"""

from .product_info import (
    PRODUCT_INFO,
    get_product_context,
    get_pricing_summary,
    get_features_list,
    get_contact_email
)

__all__ = [
    'PRODUCT_INFO',
    'get_product_context',
    'get_pricing_summary',
    'get_features_list',
    'get_contact_email'
]
