'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Hook for managing focus trap within a modal or dropdown
 */
export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Focus first element when trap becomes active
        firstElement?.focus();

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isActive]);

    return containerRef;
};

/**
 * Hook for managing keyboard navigation in lists/tables
 */
export function useKeyboardNavigation<T>(
    items: T[],
    onSelect: (item: T, index: number) => void,
    options: {
        onEscape?: () => void;
        onEnter?: (item: T, index: number) => void;
        initialIndex?: number;
    } = {}
) {
    const [focusedIndex, setFocusedIndex] = React.useState(options.initialIndex ?? -1);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < items.length) {
                    const item = items[focusedIndex];
                    if (item !== undefined) {
                        onSelect(item, focusedIndex);
                        options.onEnter?.(item, focusedIndex);
                    }
                }
                break;
            case 'Escape':
                e.preventDefault();
                options.onEscape?.();
                break;
            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setFocusedIndex(items.length - 1);
                break;
        }
    }, [items, focusedIndex, onSelect, options]);

    return {
        focusedIndex,
        setFocusedIndex,
        handleKeyDown,
    };
}

/**
 * Hook for managing ARIA live regions for screen readers
 */
export function useAriaLive() {
    const [message, setMessage] = React.useState('');
    const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite');

    const announce = React.useCallback((text: string, urgent = false) => {
        setMessage(text);
        setPriority(urgent ? 'assertive' : 'polite');

        // Clear message after announcement
        setTimeout(() => setMessage(''), 1000);
    }, []);

    const LiveRegion = React.useCallback(() => (
        <div
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
            role="status"
        >
            {message}
        </div>
    ), [message, priority]);

    return { announce, LiveRegion };
}

/**
 * Hook for managing skip links
 */
export function useSkipLinks() {
    const skipLinks = [
        { href: '#main-content', label: 'Skip to main content' },
        { href: '#navigation', label: 'Skip to navigation' },
        { href: '#search', label: 'Skip to search' },
    ];

    const SkipLinks = React.useCallback(() => (
        <div className="sr-only focus-within:not-sr-only">
            {skipLinks.map(link => (
                <a
                    key={link.href}
                    href={link.href}
                    className="block p-2 bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {link.label}
                </a>
            ))}
        </div>
    ), [skipLinks]);

    return { SkipLinks };
}

/**
 * Enhanced Button component with accessibility features
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    disabled,
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
            case 'secondary':
                return 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500';
            case 'destructive':
                return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
            default:
                return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return 'px-3 py-1.5 text-sm';
            case 'lg':
                return 'px-6 py-3 text-lg';
            default:
                return 'px-4 py-2 text-base';
        }
    };

    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`
                ${getVariantStyles()}
                ${getSizeStyles()}
                rounded-lg font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${props.className || ''}
            `}
            aria-disabled={disabled || loading}
            aria-describedby={loading ? 'loading-text' : undefined}
        >
            {loading && (
                <span id="loading-text" className="sr-only">
                    Loading, please wait
                </span>
            )}
            {loading ? (
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                </div>
            ) : (
                children
            )}
        </button>
    );
};

/**
 * Enhanced Input component with accessibility features
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helpText?: string;
    required?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
    label,
    error,
    helpText,
    required = false,
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText ? `${inputId}-help` : undefined;

    return (
        <div className="space-y-1">
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
                {required && (
                    <span className="text-red-500 ml-1" aria-label="required">
                        *
                    </span>
                )}
            </label>

            <input
                {...props}
                id={inputId}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={[errorId, helpId].filter(Boolean).join(' ') || undefined}
                className={`
                    block w-full px-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${error
                        ? 'border-red-300 text-red-900 placeholder-red-300'
                        : 'border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                    dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
                    ${props.className || ''}
                `}
            />

            {helpText && (
                <p id={helpId} className="text-sm text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}

            {error && (
                <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

/**
 * Screen reader only text utility
 */
export const SrOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="sr-only">{children}</span>
);

export default {
    useFocusTrap,
    useKeyboardNavigation,
    useAriaLive,
    useSkipLinks,
    AccessibleButton,
    AccessibleInput,
    SrOnly,
};
