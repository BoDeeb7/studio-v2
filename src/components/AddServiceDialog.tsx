
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
import { Plus, Camera, Loader2 } from "lucide-react";
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
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("face");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(selectedCategoryId === "all" ? "face" : selectedCategoryId);
    }
  }, [isOpen, selectedCategoryId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name || !imageUrl) return;
    setLoading(true);
    
    onAdd({
      name,
      price: Number(price),
      description,
      imageUrl,
      categoryId: category
    });
    
    setName("");
    setPrice("45");
    setDescription("");
    setImageUrl("");
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
            Enter details and upload an image from your device.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6 py-2">
          <div className="grid gap-4 py-4">
            {/* Image Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square w-full rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group max-w-[280px] mx-auto"
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </>
              ) : (
                <>
                  <Camera className="text-pink-300 w-10 h-10 mb-2" />
                  <span className="text-[10px] uppercase font-bold text-pink-400">Upload Photo</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
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
            disabled={loading || !name || !imageUrl}
            className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[10px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Publish Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
