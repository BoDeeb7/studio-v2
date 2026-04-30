"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Camera, Loader2, Trash2, X } from "lucide-react";
import { MakeupService } from './ServiceCard';
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddServiceDialogProps {
  onAdd: (service: Omit<MakeupService, 'id'>) => void;
  categories: { id: string, name: string }[];
  selectedCategoryId: string;
}

export function AddServiceDialog({ onAdd, categories, selectedCategoryId }: AddServiceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("45");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [category, setCategory] = useState("face");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(selectedCategoryId === "all" ? "face" : selectedCategoryId);
    }
  }, [isOpen, selectedCategoryId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setImageUrls(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name || imageUrls.length === 0) return;
    setLoading(true);
    
    onAdd({
      name,
      price: Number(price),
      description,
      imageUrls: imageUrls,
      categoryId: category
    });
    
    setName("");
    setPrice("45");
    setDescription("");
    setImageUrls([]);
    setIsOpen(false);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="rounded-full bg-white/60 border-pink-200 text-[10px] uppercase tracking-widest h-12 px-8 text-pink-700 hover:bg-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Manual Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-pink-200 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-display text-xl uppercase text-pink-700">Add New Product</DialogTitle>
          <DialogDescription className="text-pink-500/70 text-[10px] uppercase tracking-widest">
            Enter details and upload one or more images.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6 py-2">
          <div className="grid gap-4 py-4">
            {/* Multiple Image Upload Area */}
            <div className="space-y-4">
              <Label className="text-pink-600 font-bold text-xs uppercase">Product Images</Label>
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-pink-100 group">
                    <img src={url} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center hover:bg-pink-100/50 transition-colors"
                >
                  <Plus className="text-pink-300 w-6 h-6" />
                  <span className="text-[8px] uppercase font-bold text-pink-400 mt-1">Add</span>
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name" className="text-pink-600 font-bold text-xs uppercase">Product Name</Label>
              <Input
                id="name"
                placeholder="e.g. Silk Foundation"
                className="bg-white/60 border-pink-100 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price" className="text-pink-600 font-bold text-xs uppercase">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  className="bg-white/60 border-pink-100 rounded-xl"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-pink-600 font-bold text-xs uppercase">Category</Label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-pink-100 bg-white/60 px-3 py-2 text-sm text-pink-900 focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.filter(c => c.id !== "all").map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc" className="text-pink-600 font-bold text-xs uppercase">Description</Label>
              <Textarea
                id="desc"
                placeholder="Describe the product details..."
                className="bg-white/60 border-pink-100 rounded-xl min-h-[80px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !name || imageUrls.length === 0}
            className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[10px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Publish Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}