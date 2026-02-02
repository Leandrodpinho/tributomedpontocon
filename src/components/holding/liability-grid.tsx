"use client";

import { useState } from "react";
import { Plus, Trash2, CreditCard, Landmark, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Liability } from "@/types/holding";
import { formatCurrency } from "@/lib/utils";

interface LiabilityGridProps {
    liabilities: Liability[];
    onChange: (items: Liability[]) => void;
}

export function LiabilityGrid({ liabilities, onChange }: LiabilityGridProps) {
    const [newItem, setNewItem] = useState<Partial<Liability>>({
        type: 'BANK',
        value: 0
    });

    const handleAdd = () => {
        if (!newItem.name || !newItem.value) return;

        // Garantir que tipo 'BANK' | 'FISCAL' | 'FAMILY' | 'LABOR' seja respeitado
        const type = (newItem.type as 'BANK' | 'FISCAL' | 'FAMILY' | 'LABOR') || 'BANK';

        const item: Liability = {
            id: crypto.randomUUID(),
            name: newItem.name,
            type: type,
            value: Number(newItem.value),
            description: newItem.description || ''
        };

        onChange([...liabilities, item]);
        setNewItem({ type: 'BANK', value: 0, name: '' });
    };

    const handleRemove = (id: string) => {
        onChange(liabilities.filter(a => a.id !== id));
    };

    const totalDebt = liabilities.reduce((sum, a) => sum + a.value, 0);

    return (
        <div className="space-y-6 mt-8 border-t border-white/10 pt-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Mapeamento de Dívidas (Passivo)</h3>
                    <p className="text-xs text-slate-400">Dívidas reduzem o valor das quotas a serem doadas.</p>
                </div>
            </div>

            {/* Form de Adição */}
            <div className="grid gap-4 md:grid-cols-4 items-end p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
                <div className="md:col-span-1 space-y-2">
                    <Label className="text-xs text-slate-400">Descrição da Dívida</Label>
                    <Input
                        placeholder="Ex: Financiamento Imóvel"
                        value={newItem.name || ''}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        className="bg-slate-900 border-white/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Tipo</Label>
                    <Select value={newItem.type} onValueChange={(v: any) => setNewItem({ ...newItem, type: v })}>
                        <SelectTrigger className="bg-slate-900 border-white/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BANK">Bancária / Financiamento</SelectItem>
                            <SelectItem value="FISCAL">Fiscal (Impostos)</SelectItem>
                            <SelectItem value="LABOR">Trabalhista</SelectItem>
                            <SelectItem value="FAMILY">Familiar</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Valor Devedor</Label>
                    <Input
                        type="number"
                        placeholder="R$"
                        value={newItem.value || ''}
                        onChange={e => setNewItem({ ...newItem, value: Number(e.target.value) })}
                        className="bg-slate-900 border-white/20"
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleAdd} size="sm" className="bg-red-600 hover:bg-red-700 text-white w-full">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Dívida
                    </Button>
                </div>
            </div>

            {/* Tabela de Dívidas */}
            {liabilities.length > 0 && (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                    <div className="divide-y divide-white/5">
                        {liabilities.map(item => (
                            <div key={item.id} className="bg-white/5 p-3 grid grid-cols-12 items-center text-sm">
                                <div className="col-span-1 text-slate-400">
                                    {item.type === 'BANK' && <Landmark className="h-4 w-4" />}
                                    {item.type === 'FISCAL' && <CreditCard className="h-4 w-4" />}
                                    {item.type === 'LABOR' && <AlertCircle className="h-4 w-4" />}
                                    {item.type === 'FAMILY' && <AlertCircle className="h-4 w-4" />}
                                </div>
                                <div className="col-span-7 font-medium text-white">{item.name}</div>
                                <div className="col-span-3 text-right text-red-400">-{formatCurrency(item.value)}</div>
                                <div className="col-span-1 flex justify-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="h-6 w-6 text-slate-500 hover:text-red-400">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-900 p-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-slate-500 uppercase font-bold">Total Passivo</span>
                        <span className="text-lg font-bold text-red-500">-{formatCurrency(totalDebt)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
