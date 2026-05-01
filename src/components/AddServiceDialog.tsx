
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
import { Plus, Loader2, X, AlertTriangle } from "lucide-react";
import { MakeupService } from './ServiceCard';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

interface AddServiceDialogProps {
  onAdd: (service: Omit<MakeupService, 'id'>) => Promise<void>;
  categories: { id: string, name: string }[];
  selectedCategoryId: string;
}

export function AddServiceDialog({ onAdd, categories, selectedCategoryId }: AddServiceDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("45");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [category, setCategory] = useState("face");
  const [sizeWarning, setSizeWarning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(selectedCategoryId === "all" ? "face" : selectedCategoryId);
    }
  }, [isOpen, selectedCategoryId]);

  useEffect(() => {
    const totalSize = imageUrls.reduce((acc, img) => acc + img.length, 0);
    setSizeWarning(totalSize > 800000);
  }, [imageUrls]);

  // Function to compress images using Canvas
  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic (max 800px)
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Quality 0.7 (70%) reduces size significantly
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressed);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLoading(true);
      const newImages: string[] = [];
      const fileList = Array.from(files);

      for (const file of fileList) {
        const reader = new FileReader();
        const base64: string = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        // Auto-compress before adding to state
        const compressed = await compressImage(base64);
        newImages.push(compressed);
      }
      
      setImageUrls(prev => [...prev, ...newImages]);
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name || imageUrls.length === 0) return;
    setLoading(true);
    
    try {
      // Ensure we are sending to Firestore and awaiting the response
      await addDocumentNonBlocking(collection(db, 'products'), {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        imageUrls: imageUrls,
        categoryId: category,
        createdAt: serverTimestamp() // Official Firebase Time
      });
      
      toast({ title: "Product Published", description: "Successfully saved to cloud storage." });
      
      setName("");
      setPrice("45");
      setDescription("");
      setImageUrls([]);
      setIsOpen(false);
    } catch (e: any) {
      console.error("CRITICAL FIRESTORE ERROR:", e);
      toast({ 
        variant: "destructive", 
        title: "Save Failed", 
        description: e.message?.includes('too large') 
          ? "Images are still too large. Try fewer photos." 
          : "Could not connect to database. Check internet."
      });
    } finally {
      setLoading(false);
    }
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
            Data is auto-compressed and synced globally.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6 py-2">
          <div className="grid gap-4 py-4">
            {sizeWarning && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-[10px] font-bold">
                  Total data approaching 1MB limit. Remove some photos.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label className="text-pink-600 font-bold text-xs uppercase">Product Images (Auto-Compressed)</Label>
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-pink-100 group">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="aspect-square rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center hover:bg-pink-100/50 transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin text-pink-400" /> : (
                    <>
                      <Plus className="text-pink-300 w-6 h-6" />
                      <span className="text-[8px] uppercase font-bold text-pink-400 mt-1">Add</span>
                    </>
                  )}
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
            {loading ? <Loader2 className="animate-spin" /> : "Publish to Everyone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
