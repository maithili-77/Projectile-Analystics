"""
Scikit-learn Version Compatibility Utility
Provides monkey-patching for unpickling models saved with sklearn 1.5.1 on newer sklearn versions.
"""

import sys
import sklearn.compose._column_transformer

def apply_compat_patches():
    """Apply global patches to scikit-learn module structures."""
    if not hasattr(sklearn.compose._column_transformer, '_RemainderColsList'):
        class _RemainderColsList(list):
            pass
        sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

def fix_unpickled_estimator(obj):
    """
    Recursively inspect and patch unpickled scikit-learn objects
    to ensure attributes missing across sklearn versions (such as _fill_dtype) exist.
    """
    if hasattr(obj, '__dict__'):
        cls_name = obj.__class__.__name__
        if cls_name == 'SimpleImputer':
            if not hasattr(obj, '_fill_dtype'):
                if hasattr(obj, '_fit_dtype'):
                    obj._fill_dtype = obj._fit_dtype
                else:
                    obj._fill_dtype = None

        if hasattr(obj, 'steps'):
            for _, step in obj.steps:
                fix_unpickled_estimator(step)
        if hasattr(obj, 'transformers'):
            for item in obj.transformers:
                if len(item) >= 2:
                    fix_unpickled_estimator(item[1])
        if hasattr(obj, 'transformers_'):
            for item in obj.transformers_:
                if len(item) >= 2:
                    fix_unpickled_estimator(item[1])
        if hasattr(obj, 'named_steps'):
            for step in obj.named_steps.values():
                fix_unpickled_estimator(step)
    return obj
