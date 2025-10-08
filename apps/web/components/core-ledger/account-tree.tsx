'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button, Card, Badge } from 'aibos-ui';
import { useKeyboardNavigation, useAriaLive } from '@/components/shared/accessibility';
import type { AccountHierarchyNode } from '@aibos/contracts/core-ledger/schemas';

interface AccountTreeProps {
    data: AccountHierarchyNode[];
    onReparent?: (accountId: number, newParentId: number | null) => Promise<void>;
    onAccountSelect?: (account: AccountHierarchyNode) => void;
    isLoading?: boolean;
}

interface TreeNodeProps {
    node: AccountHierarchyNode;
    level: number;
    onReparent?: (accountId: number, newParentId: number | null) => Promise<void>;
    onAccountSelect?: (account: AccountHierarchyNode) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(({
    node,
    level,
    onReparent,
    onAccountSelect,
    isExpanded,
    onToggleExpand,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', node.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
    }, [node.id]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const draggedAccountId = parseInt(e.dataTransfer.getData('text/plain'), 10);

        if (draggedAccountId === node.id) return; // Can't drop on itself

        if (onReparent) {
            try {
                await onReparent(draggedAccountId, node.id);
            } catch (error) {
                console.error('Failed to reparent account:', error);
            }
        }
    }, [node.id, onReparent]);

    const handleClick = useCallback(() => {
        onAccountSelect?.(node);
    }, [node, onAccountSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (e.key === 'Enter') {
                handleClick();
            } else if (e.key === ' ') {
                onToggleExpand();
            }
        }
    }, [handleClick, onToggleExpand]);

    const hasChildren = node.children && node.children.length > 0;
    const indentLevel = level * 24; // 24px per level

    return (
        <div className="select-none">
            <div
                className={`
          flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200
          hover:bg-gray-50 dark:hover:bg-gray-800
          ${dragOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600' : ''}
          ${isDragging ? 'opacity-50' : ''}
        `}
                style={{ paddingLeft: `${indentLevel + 12}px` }}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="treeitem"
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-level={level + 1}
                aria-label={`Account ${node.name}, Level ${level + 1}`}
            >
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                    <button
                        className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand();
                        }}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ) : (
                    <div className="w-6 mr-2" /> // Spacer for alignment
                )}

                {/* Account Code */}
                <div className="font-mono text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                    {node.code}
                </div>

                {/* Account Name */}
                <div className="flex-1 ml-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        {node.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Level {node.level} • {node.accountType}
                    </div>
                </div>

                {/* Account Type Badge */}
                <Badge
                    variant={
                        node.accountType === 'ASSET' ? 'success' :
                            node.accountType === 'LIABILITY' ? 'warning' :
                                node.accountType === 'EQUITY' ? 'info' :
                                    node.accountType === 'REVENUE' ? 'default' : 'secondary'
                    }
                    className="ml-2"
                >
                    {node.accountType}
                </Badge>

                {/* Normal Balance Indicator */}
                <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {node.normalBalance}
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div role="group" aria-label={`Children of ${node.name}`}>
                    {node.children.map((child) => {
                        const childNode = child as AccountHierarchyNode;
                        const props: TreeNodeProps = {
                            node: childNode,
                            level: level + 1,
                            isExpanded: true,
                            onToggleExpand: () => { }
                        };

                        if (onReparent) {
                            props.onReparent = onReparent;
                        }

                        if (onAccountSelect) {
                            props.onAccountSelect = onAccountSelect;
                        }

                        return <TreeNode key={childNode.id} {...props} />;
                    })}
                </div>
            )}
        </div>
    );
});

TreeNode.displayName = 'TreeNode';

export const AccountTree: React.FC<AccountTreeProps> = ({
    data,
    onReparent,
    onAccountSelect,
    isLoading = false,
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const { announce, LiveRegion } = useAriaLive();

    // Flatten tree for keyboard navigation
    const flattenedNodes = useMemo(() => {
        const flatten = (nodes: AccountHierarchyNode[], level = 0): Array<AccountHierarchyNode & { level: number }> => {
            const result: Array<AccountHierarchyNode & { level: number }> = [];
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children && expandedNodes.has(node.id)) {
                    result.push(...flatten(node.children as AccountHierarchyNode[], level + 1));
                }
            });
            return result;
        };
        return flatten(data);
    }, [data, expandedNodes]);

    const { handleKeyDown } = useKeyboardNavigation(
        flattenedNodes,
        (node) => {
            onAccountSelect?.(node);
            announce(`Selected account ${node.name}, code ${node.code}`);
        },
        {
            onEscape: () => announce('Exited tree navigation'),
        }
    );

    const toggleNode = useCallback((nodeId: number) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    const expandAll = useCallback(() => {
        const allNodeIds = new Set<number>();
        const collectIds = (nodes: AccountHierarchyNode[]) => {
            nodes.forEach(node => {
                allNodeIds.add(node.id);
                if (node.children) {
                    collectIds(node.children as AccountHierarchyNode[]);
                }
            });
        };
        collectIds(data);
        setExpandedNodes(allNodeIds);
        announce(`Expanded all ${allNodeIds.size} accounts`);
    }, [data, announce]);

    const collapseAll = useCallback(() => {
        setExpandedNodes(new Set());
        announce('Collapsed all accounts');
    }, [announce]);

    const handleReparent = useCallback(async (accountId: number, newParentId: number | null) => {
        if (onReparent) {
            await onReparent(accountId, newParentId);
            announce('Account reparented successfully');
        }
    }, [onReparent, announce]);

    if (isLoading) {
        return (
            <Card>
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading account hierarchy...</p>
                </div>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500">
                    <p>No accounts found. Create your first account to get started.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tree Controls */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={expandAll}
                        aria-label="Expand all accounts"
                    >
                        Expand All
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={collapseAll}
                        aria-label="Collapse all accounts"
                    >
                        Collapse All
                    </Button>
                </div>

                <div className="text-sm text-gray-500">
                    {data.length} root account{data.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Tree Container */}
            <Card>
                <div
                    className="max-h-96 overflow-y-auto"
                    role="tree"
                    aria-label="Account hierarchy"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {data.map((node) => {
                        const props: TreeNodeProps = {
                            node,
                            level: 0,
                            isExpanded: expandedNodes.has(node.id),
                            onToggleExpand: () => toggleNode(node.id)
                        };

                        if (handleReparent) {
                            props.onReparent = handleReparent;
                        }

                        if (onAccountSelect) {
                            props.onAccountSelect = onAccountSelect;
                        }

                        return <TreeNode key={node.id} {...props} />;
                    })}
                </div>
            </Card>

            {/* Live Region for Screen Readers */}
            <LiveRegion />

            {/* Instructions */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Click on an account to view/edit details</li>
                    <li>Drag and drop accounts to reparent them</li>
                    <li>Use keyboard navigation (Tab, Enter, Space, Arrow keys)</li>
                    <li>Press Escape to exit tree navigation</li>
                    <li>Level indicates hierarchy depth (max 5 levels)</li>
                </ul>
            </div>
        </div>
    );
};

export default AccountTree;
