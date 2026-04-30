"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Edit2, Trash2, Plus, Camera, Flower2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface MakeupService {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId?: string;
}

interface ServiceCardProps {
  service: MakeupService;
  isSupervisor: boolean;
  onUpdate: (service: MakeupService) => void;
  onDelete: (id: string) => void;
  onAddToCart?: () => void;
}

export function ServiceCard({ service, isSupervisor, onUpdate, onDelete, onAddToCart }: ServiceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service);
  const [showEffect, setShowEffect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate(editedService);
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedService({ ...editedService, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCartWithEffect = () => {
    if (onAddToCart) {
      onAddToCart();
      setShowEffect(true);
      setTimeout(() => setShowEffect(false), 1800);
    }
  };

  return (
    <div className="glass rounded-[2rem] md:rounded-[3rem] overflow-hidden group relative flex flex-col h-full">
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-white/20">
        <Image
          src={isEditing ? editedService.imageUrl : service.imageUrl}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {isEditing && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer z-10"
          >
            <Camera className="text-white w-8 h-8 md:w-10 md:h-10 mb-2" />
            <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest">Change Photo</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
        )}

        {/* Price Badge */}
        {!isEditing && (
          <div className="absolute top-3 right-3 md:top-6 md:right-6 bg-white text-pink-500 px-3 py-1 md:px-5 md:py-2 rounded-full font-display font-black text-sm md:text-xl shadow-md z-20">
            ${service.price}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 text-left flex flex-col flex-grow">
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <Input 
              className="bg-white/60 border-pink-100 text-pink-900 font-display text-sm md:text-xl h-10 md:h-12 rounded-xl"
              value={editedService.name} 
              onChange={(e) => setEditedService({...editedService, name: e.target.value})} 
            />
            <div className="flex gap-2 items-center bg-white/40 p-1 rounded-xl px-3">
              <span className="text-pink-400 font-black text-xs">$</span>
              <Input 
                className="bg-transparent border-none text-pink-600 font-bold h-8 p-0 text-xs focus-visible:ring-0"
                type="number"
                value={editedService.price} 
                onChange={(e) => setEditedService({...editedService, price: Number(e.target.value)})} 
              />
            </div>
            <Textarea 
              className="bg-white/60 border-pink-100 text-pink-800 rounded-xl min-h-[80px] text-xs"
              value={editedService.description} 
              onChange={(e) => setEditedService({...editedService, description: e.target.value})} 
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 bg-pink-500 text-white rounded-full h-10 uppercase font-black tracking-widest text-[9px]">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-full h-10 text-pink-400 text-[9px]">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col flex-grow">
            <div className="flex-grow">
              <h2 className="text-base md:text-2xl font-display font-black uppercase text-pink-600 leading-tight line-clamp-2">
                {service.name}
              </h2>
              <p className="text-pink-400/80 font-body text-[10px] md:text-sm mt-1 line-clamp-2">
                {service.description}
              </p>
            </div>

            <div className="pt-3 border-t border-pink-100 relative mt-auto">
              {showEffect && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                  <div className="relative w-full h-16">
                    <span className="absolute left-1/2 font-display text-xl md:text-3xl font-black text-pink-600 drop-shadow-md animate-thanks whitespace-nowrap">
                      Thank's
                    </span>
                    <Flower2 className="absolute left-[10%] text-pink-400 w-6 h-6 animate-flower" style={{ animationDelay: '0s', '--x-offset': '-20px' } as any} />
                    <Flower2 className="absolute right-[10%] text-pink-500 w-5 h-5 animate-flower" style={{ animationDelay: '0.1s', '--x-offset': '20px' } as any} />
                    <Flower2 className="absolute left-[30%] text-pink-300 w-7 h-7 animate-flower" style={{ animationDelay: '0.2s', '--x-offset': '-10px' } as any} />
                  </div>
                </div>
              )}

              {!isSupervisor ? (
                <Button 
                  onClick={handleAddToCartWithEffect}
                  className={cn(
                    "w-full bg-white text-pink-500 hover:bg-pink-50 border border-pink-100 rounded-xl md:rounded-2xl h-10 md:h-14 text-[10px] md:text-[12px] uppercase tracking-widest font-black transition-all shadow-sm relative overflow-hidden",
                    showEffect && "scale-95 brightness-95"
                  )}
                >
                  <Plus className="mr-1 w-4 h-4" /> ADD TO BAG
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-white/60 border border-pink-100 text-pink-500 hover:bg-white rounded-full h-10 text-[9px] uppercase font-bold"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button 
                    onClick={() => onDelete(service.id)}
                    variant="destructive"
                    className="rounded-full h-10 w-10 p-0 shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
