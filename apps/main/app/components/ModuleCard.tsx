"use client";
import Link from "next/link";
import { type ModuleStatus } from '@aibos/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'aibos-ui';

interface ModuleCardProps {
    module: ModuleStatus;
    tenant: string;
}

export function ModuleCard({ module, tenant }: ModuleCardProps): React.JSX.Element {
    const isAvailable = module.status === 'on';

    // Determine the route based on module
    const getModuleRoute = (moduleId: string) => {
        switch (moduleId) {
            case 'M01':
                return '/core-ledger';
            case 'M02':
                return '/journal-entries';
            case 'M03':
                return '/trial-balance';
            default:
                return `/${moduleId.toLowerCase()}`;
        }
    };

    const getModuleIcon = (moduleId: string) => {
        switch (moduleId) {
            case 'M01':
                return '📊';
            case 'M02':
                return '📝';
            case 'M03':
                return '📈';
            default:
                return '🔧';
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'on':
                return {
                    background: 'hsl(var(--aibos-success) / 0.15)',
                    color: 'hsl(var(--aibos-success))',
                    border: '1px solid hsl(var(--aibos-success) / 0.3)'
                };
            case 'beta':
                return {
                    background: 'hsl(var(--aibos-warning) / 0.15)',
                    color: 'hsl(var(--aibos-warning))',
                    border: '1px solid hsl(var(--aibos-warning) / 0.3)'
                };
            default:
                return {
                    background: 'hsl(var(--aibos-semantic-muted))',
                    color: 'hsl(var(--aibos-semantic-muted-foreground))',
                    border: '1px solid hsl(var(--aibos-semantic-border))'
                };
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'on':
                return '✅ Ready';
            case 'beta':
                return '🚧 Beta';
            default:
                return '⏳ Coming Soon';
        }
    };

    const baseUrl = process.env.NEXT_PUBLIC_WEB_SANDBOX_BASE_URL || 'http://localhost:3001';
    const route = getModuleRoute(module.id);
    const url = new URL(route, baseUrl);
    url.searchParams.set("tenant", tenant);

    return (
        <Card className="group relative hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300"
                        style={{
                            background: 'hsl(var(--aibos-semantic-muted))',
                            borderRadius: 'calc(var(--aibos-spacing-unit) * 1.5)'
                        }}
                    >
                        {getModuleIcon(module.id)}
                    </div>
                    <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={getStatusBadgeStyle(module.status)}
                    >
                        {getStatusText(module.status)}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    <CardTitle
                        className="text-xl mb-2 group-hover:text-primary transition-colors"
                        style={{
                            color: 'hsl(var(--aibos-semantic-foreground))',
                            fontSize: 'var(--aibos-font-size-xl)',
                            fontWeight: 'var(--aibos-font-weight-bold)'
                        }}
                    >
                        {module.name}
                    </CardTitle>
                    <CardDescription
                        className="text-sm leading-relaxed"
                        style={{
                            color: 'hsl(var(--aibos-semantic-muted-foreground))',
                            fontSize: 'var(--aibos-font-size-sm)'
                        }}
                    >
                        {module.description}
                    </CardDescription>
                </div>

                {/* Module Stats (only for available modules) */}
                {isAvailable && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--aibos-semantic-muted-foreground))' }}>
                            <span>API Endpoints</span>
                            <span className="font-medium" style={{ color: 'hsl(var(--aibos-semantic-primary))' }}>
                                {module.endpoints.length}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--aibos-semantic-muted-foreground))' }}>
                            <span>UI Components</span>
                            <span className="font-medium" style={{ color: 'hsl(var(--aibos-success))' }}>
                                {module.uiComponents.length}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--aibos-semantic-muted-foreground))' }}>
                            <span>Last Updated</span>
                            <span className="font-medium" style={{ color: 'hsl(var(--aibos-semantic-accent))' }}>
                                {module.lastUpdated}
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                    {isAvailable ? (
                        <Link
                            href={url.toString()}
                            target="_blank"
                            className="block w-full text-center font-semibold py-3 px-4 rounded-lg transition-all duration-300 group-hover:scale-105"
                            style={{
                                background: 'hsl(var(--aibos-semantic-primary))',
                                color: 'hsl(var(--aibos-semantic-primary-foreground))',
                                fontSize: 'var(--aibos-font-size-sm)',
                                fontWeight: 'var(--aibos-font-weight-semibold)',
                                borderRadius: 'calc(var(--aibos-spacing-unit) * 1)',
                                boxShadow: 'var(--aibos-shadow-elev-1)'
                            }}
                        >
                            🚀 Launch {module.name}
                        </Link>
                    ) : (
                        <button
                            disabled
                            className="w-full py-3 px-4 text-center cursor-not-allowed font-semibold rounded-lg"
                            style={{
                                background: 'hsl(var(--aibos-semantic-muted))',
                                color: 'hsl(var(--aibos-semantic-muted-foreground))',
                                border: '1px solid hsl(var(--aibos-semantic-border))',
                                fontSize: 'var(--aibos-font-size-sm)',
                                fontWeight: 'var(--aibos-font-weight-semibold)',
                                borderRadius: 'calc(var(--aibos-spacing-unit) * 1)'
                            }}
                        >
                            {module.status === 'beta' ? '🚧 Beta Coming Soon' : '⏳ In Development'}
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}