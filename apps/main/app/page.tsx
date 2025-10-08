"use client";
import { useState, useEffect } from 'react';
import { getAllModules, type ModuleStatus } from '@aibos/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'aibos-ui';
import { TenantSwitcher } from './components/TenantSwitcher';
import { ModuleCard } from './components/ModuleCard';

export default function MasterDashboard(): React.JSX.Element {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('sandbox');

  useEffect(() => {
    setModules(getAllModules());
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--aibos-semantic-background))' }}>
      {/* Premium Header */}
      <div className="border-b" style={{ borderColor: 'hsl(var(--aibos-semantic-border))' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1
              className="text-5xl font-bold mb-4"
              style={{
                color: 'hsl(var(--aibos-semantic-primary))',
                fontSize: 'var(--aibos-font-size-4xl)',
                fontWeight: 'var(--aibos-font-weight-bold)'
              }}
            >
              AIBOS ERP Modules
            </h1>
            <p
              className="text-lg"
              style={{
                color: 'hsl(var(--aibos-semantic-muted-foreground))',
                fontSize: 'var(--aibos-font-size-lg)'
              }}
            >
              Select a module to explore and test
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Tenant Selection */}
          <div className="lg:col-span-1">
            <TenantSwitcher
              selectedTenant={selectedTenant}
              onTenantChange={setSelectedTenant}
            />
          </div>

          {/* Right Column - Module Cards */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h2
                className="text-3xl font-bold mb-3"
                style={{
                  color: 'hsl(var(--aibos-semantic-foreground))',
                  fontSize: 'var(--aibos-font-size-3xl)',
                  fontWeight: 'var(--aibos-font-weight-bold)'
                }}
              >
                Available Modules
              </h2>
              <p
                className="text-lg"
                style={{
                  color: 'hsl(var(--aibos-semantic-muted-foreground))',
                  fontSize: 'var(--aibos-font-size-lg)'
                }}
              >
                Choose a module to launch and explore
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  tenant={selectedTenant}
                />
              ))}
            </div>

            {/* Coming Soon Section */}
            <div className="mt-16">
              <h3
                className="text-2xl font-bold mb-6"
                style={{
                  color: 'hsl(var(--aibos-semantic-foreground))',
                  fontSize: 'var(--aibos-font-size-2xl)',
                  fontWeight: 'var(--aibos-font-weight-bold)'
                }}
              >
                Coming Soon
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <Card className="opacity-60">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'hsl(var(--aibos-semantic-muted))',
                          borderRadius: 'calc(var(--aibos-spacing-unit) * 2)'
                        }}
                      >
                        <span className="text-3xl">📊</span>
                      </div>
                      <h4
                        className="text-xl font-bold mb-2"
                        style={{
                          color: 'hsl(var(--aibos-semantic-muted-foreground))',
                          fontSize: 'var(--aibos-font-size-xl)',
                          fontWeight: 'var(--aibos-font-weight-bold)'
                        }}
                      >
                        M02 Journal Entries
                      </h4>
                      <p
                        className="text-sm"
                        style={{
                          color: 'hsl(var(--aibos-semantic-muted-foreground))',
                          fontSize: 'var(--aibos-font-size-sm)'
                        }}
                      >
                        Coming Soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="opacity-60">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'hsl(var(--aibos-semantic-muted))',
                          borderRadius: 'calc(var(--aibos-spacing-unit) * 2)'
                        }}
                      >
                        <span className="text-3xl">📈</span>
                      </div>
                      <h4
                        className="text-xl font-bold mb-2"
                        style={{
                          color: 'hsl(var(--aibos-semantic-muted-foreground))',
                          fontSize: 'var(--aibos-font-size-xl)',
                          fontWeight: 'var(--aibos-font-weight-bold)'
                        }}
                      >
                        M03 Trial Balance
                      </h4>
                      <p
                        className="text-sm"
                        style={{
                          color: 'hsl(var(--aibos-semantic-muted-foreground))',
                          fontSize: 'var(--aibos-font-size-sm)'
                        }}
                      >
                        Coming Soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
