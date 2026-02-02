"use client";

import { useState } from "react";
import { Plus, Trash2, Users, HeartHandshake, Baby, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FamilyMember, MaritalRegime } from "@/types/holding";

interface FamilyFormProps {
    members: FamilyMember[];
    onChange: (members: FamilyMember[]) => void;
}

export function FamilyForm({ members, onChange }: FamilyFormProps) {
    const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
        role: 'HEIR',
        inConflict: false
    });

    const handleAdd = () => {
        if (!newMember.name) return;

        const member: FamilyMember = {
            id: crypto.randomUUID(),
            name: newMember.name,
            role: newMember.role as any,
            maritalRegime: newMember.maritalRegime as MaritalRegime,
            inConflict: newMember.inConflict || false
        };

        onChange([...members, member]);
        setNewMember({ role: 'HEIR', name: '', inConflict: false });
    };

    const handleRemove = (id: string) => {
        onChange(members.filter(m => m.id !== id));
    };

    return (
        <div className="space-y-6">

            {/* Form Card */}
            <div className="grid gap-4 md:grid-cols-5 items-end p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs text-slate-400">Nome Completo</Label>
                    <Input
                        placeholder="Ex: João da Silva"
                        value={newMember.name || ''}
                        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                        className="bg-slate-900 border-white/20"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Papel na Família</Label>
                    <Select value={newMember.role} onValueChange={(v: any) => setNewMember({ ...newMember, role: v })}>
                        <SelectTrigger className="bg-slate-900 border-white/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PATRIARCH">Patriarca (Fundador)</SelectItem>
                            <SelectItem value="MATRIARCH">Matriarca (Fundadora)</SelectItem>
                            <SelectItem value="HEIR">Herdeiro (Filho/Neto)</SelectItem>
                            <SelectItem value="SPOUSE">Cônjuge (Genro/Nora)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {newMember.role === 'HEIR' && (
                    <div className="flex items-center gap-2 pb-3">
                        <Switch
                            checked={newMember.inConflict}
                            onCheckedChange={c => setNewMember({ ...newMember, inConflict: c })}
                        />
                        <Label className="text-xs text-slate-400">Risco de Conflito?</Label>
                    </div>
                )}

                <div className="md:col-span-5 flex justify-end">
                    <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Membro
                    </Button>
                </div>
            </div>

            {/* Lista de Membros */}
            <div className="space-y-3">
                {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${member.role === 'PATRIARCH' || member.role === 'MATRIARCH' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700/50 text-slate-400'}`}>
                                {member.role === 'PATRIARCH' || member.role === 'MATRIARCH' ? <Users className="h-4 w-4" /> : <Baby className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-xs text-slate-400 capitalize">
                                    {member.role === 'PATRIARCH' && 'Patriarca'}
                                    {member.role === 'MATRIARCH' && 'Matriarca'}
                                    {member.role === 'HEIR' && 'Herdeiro'}
                                    {member.role === 'SPOUSE' && 'Cônjuge (Agregado)'}
                                </p>
                            </div>
                            {member.inConflict && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                    <span className="text-[10px] text-red-400 font-bold">Risco de Litígio</span>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(member.id)} className="h-8 w-8 text-slate-500 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {members.length === 0 && (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                        Comece adicionando o Patriarca e a Matriarca.
                    </div>
                )}
            </div>

        </div>
    );
}
