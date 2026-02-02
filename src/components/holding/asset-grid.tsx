"use client";

import { useState } from "react";
import { Plus, Trash2, Building2, Car, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Asset, AssetType } from "@/types/holding";
import { formatCurrency } from "@/lib/utils";

interface AssetGridProps {
    assets: Asset[];
    onChange: (assets: Asset[]) => void;
}

export function AssetGrid({ assets, onChange }: AssetGridProps) {
    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        type: 'REAL_ESTATE',
        marketValue: 0,
        bookValue: 0,
        rentalIncome: 0
    });

    const handleAdd = () => {
        if (!newAsset.name || !newAsset.marketValue || !newAsset.bookValue) return;

        const asset: Asset = {
            id: crypto.randomUUID(),
            name: newAsset.name,
            type: newAsset.type as AssetType,
            marketValue: Number(newAsset.marketValue),
            bookValue: Number(newAsset.bookValue),
            rentalIncome: Number(newAsset.rentalIncome || 0),
        };

        onChange([...assets, asset]);
        setNewAsset({ type: 'REAL_ESTATE', marketValue: 0, bookValue: 0, rentalIncome: 0, name: '' });
    };

    const handleRemove = (id: string) => {
        onChange(assets.filter(a => a.id !== id));
    };

    // Totais
    const totalMarket = assets.reduce((sum, a) => sum + a.marketValue, 0);
    const totalBook = assets.reduce((sum, a) => sum + a.bookValue, 0);
    const riskGap = totalMarket - totalBook;

    return (
        <div className="space-y-6">

            {/* Form de Adição */}
            <div className="grid gap-4 md:grid-cols-5 items-end p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs text-slate-400">Nome do Bem</Label>
                    <Input
                        placeholder="Ex: Apto Jardins"
                        value={newAsset.name || ''}
                        onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                        className="bg-slate-900 border-white/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Tipo</Label>
                    <Select value={newAsset.type} onValueChange={(v: string) => setNewAsset({ ...newAsset, type: v as AssetType })}>
                        <SelectTrigger className="bg-slate-900 border-white/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="REAL_ESTATE">Imóvel</SelectItem>
                            <SelectItem value="FINANCIAL">Aplicação</SelectItem>
                            <SelectItem value="VEHICLE">Veículo</SelectItem>
                            <SelectItem value="COMPANY_QUOTA">Empresa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Valor Mercado</Label>
                    <Input
                        type="number"
                        placeholder="R$"
                        value={newAsset.marketValue || ''}
                        onChange={e => setNewAsset({ ...newAsset, marketValue: Number(e.target.value) })}
                        className="bg-slate-900 border-white/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Valor Declarado (IR)</Label>
                    <Input
                        type="number"
                        placeholder="R$"
                        value={newAsset.bookValue || ''}
                        onChange={e => setNewAsset({ ...newAsset, bookValue: Number(e.target.value) })}
                        className="bg-slate-900 border-white/20"
                    />
                </div>
                <div className="md:col-span-5 flex justify-end">
                    <Button onClick={handleAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Bem
                    </Button>
                </div>
            </div>

            {/* Tabela de Bens */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-slate-900/50 p-3 grid grid-cols-12 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-1">Tipo</div>
                    <div className="col-span-4">Descrição</div>
                    <div className="col-span-3 text-right">Valor Mercado</div>
                    <div className="col-span-3 text-right">Valor Histórico</div>
                    <div className="col-span-1 text-center">Ações</div>
                </div>
                <div className="divide-y divide-white/5">
                    {assets.map(asset => (
                        <div key={asset.id} className="bg-white/5 p-3 grid grid-cols-12 items-center text-sm hover:bg-white/10 transition-colors">
                            <div className="col-span-1 text-slate-400">
                                {asset.type === 'REAL_ESTATE' && <Building2 className="h-4 w-4" />}
                                {asset.type === 'VEHICLE' && <Car className="h-4 w-4" />}
                                {asset.type === 'FINANCIAL' && <DollarSign className="h-4 w-4" />}
                                {asset.type === 'COMPANY_QUOTA' && <TrendingUp className="h-4 w-4" />}
                            </div>
                            <div className="col-span-4 font-medium text-white">{asset.name}</div>
                            <div className="col-span-3 text-right text-emerald-400">{formatCurrency(asset.marketValue)}</div>
                            <div className="col-span-3 text-right text-slate-400">{formatCurrency(asset.bookValue)}</div>
                            <div className="col-span-1 flex justify-center">
                                <Button variant="ghost" size="icon" onClick={() => handleRemove(asset.id)} className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {assets.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum bem cadastrado. Adicione acima.
                        </div>
                    )}
                </div>

                {/* Footer de Totais */}
                {assets.length > 0 && (
                    <div className="bg-slate-900 p-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <span className="block text-xs text-slate-500">Total Patrimônio (Real)</span>
                            <span className="block text-lg font-bold text-white">{formatCurrency(totalMarket)}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500">Total Declarado (IR)</span>
                            <span className="block text-lg font-bold text-slate-300">{formatCurrency(totalBook)}</span>
                        </div>
                        <div className="md:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 px-4 flex items-center justify-between">
                            <div>
                                <span className="block text-xs text-amber-500 uppercase font-bold">Risco Sucessório (Gap)</span>
                                <span className="block text-xs text-amber-300/70">Base tributável &quot;extra&quot; no inventário</span>
                            </div>
                            <span className="text-xl font-bold text-amber-400">{formatCurrency(riskGap)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
