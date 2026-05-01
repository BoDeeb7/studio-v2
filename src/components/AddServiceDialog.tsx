
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
import { Plus, Loader2, X, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirebase } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";

interface AddServiceDialogProps {
  categories: { id: string, name: string }[];
  selectedCategoryId: string;
}

export function AddServiceDialog({ categories, selectedCategoryId }: AddServiceDialogProps) {
  const { toast } = useToast();
  const { firestore, storage, auth } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("45");
  const [description, setDescription] = useState("");
  const [tempImages, setTempImages] = useState<{file: File, preview: string}[]>([]);
  const [category, setCategory] = useState("face");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initialCat = selectedCategoryId === "all" ? (categories.find(c => c.id !== 'all')?.id || "face") : selectedCategoryId;
      setCategory(initialCat);
    }
  }, [isOpen, selectedCategoryId, categories]);

  // وظيفة لضغط الصور قبل الرفع لضمان نجاح العملية على الهواتف
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          }, 'image/jpeg', 0.7); // جودة 70% كافية جداً للموبايل
        };
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setTempImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setTempImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في الصلاحيات", 
        description: "يرجى الانتظار ثانية حتى يتم تهيئة الاتصال بالسحاب." 
      });
      return;
    }

    if (!name || tempImages.length === 0) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إضافة اسم وصورة واحدة على الأقل." });
      return;
    }
    
    setLoading(true);
    
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < tempImages.length; i++) {
        const item = tempImages[i];
        
        // ضغط الصورة قبل الرفع (مهم جداً للهواتف)
        const compressedBlob = await compressImage(item.file);
        
        const storagePath = `products/${Date.now()}_${i}.jpg`;
        const storageRef = ref(storage, storagePath);
        
        const snapshot = await uploadBytes(storageRef, compressedBlob);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }

      const productData = {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        imageUrls: uploadedUrls,
        categoryId: category,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(firestore, 'products'), productData);
      
      toast({ title: "تم الحفظ الدائم", description: "المنتج متاح الآن لجميع الزبائن." });
      
      setName("");
      setPrice("45");
      setDescription("");
      tempImages.forEach(img => URL.revokeObjectURL(img.preview));
      setTempImages([]);
      setIsOpen(false);
      
    } catch (e: any) {
      console.error("MOBILE UPLOAD ERROR:", e);
      toast({ 
        variant: "destructive", 
        title: "فشل الحفظ في السحاب", 
        description: "تأكد من استقرار الإنترنت وتحديث الصفحة. الخطأ: " + (e.code || "Network error")
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full bg-white/60 border-pink-200 text-[10px] uppercase tracking-widest h-12 px-8 text-pink-700 hover:bg-white">
          <Plus className="w-4 h-4 mr-2" /> إضافة منتج
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-pink-200 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-display text-xl uppercase text-pink-700 text-right">منتج جديد</DialogTitle>
          <DialogDescription className="text-pink-500/70 text-[10px] uppercase tracking-widest text-right">
            يتم ضغط الصور تلقائياً لضمان نجاح الرفع من الهاتف.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6 py-2">
          <div className="grid gap-4 py-4 dir-rtl">
            <div className="space-y-4">
              <Label className="text-pink-600 font-bold text-xs uppercase block text-right">صور المنتج</Label>
              <div className="grid grid-cols-3 gap-2">
                {tempImages.map((img, idx) => (
                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-pink-100">
                    <img src={img.preview} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={loading}
                  type="button"
                  className="aspect-square rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center hover:bg-pink-100 transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin text-pink-400" /> : <Plus className="text-pink-300 w-6 h-6" />}
                </button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="grid gap-2 text-right">
              <Label htmlFor="name" className="text-pink-600 font-bold text-xs uppercase">اسم المنتج</Label>
              <Input id="name" placeholder="مثلاً: كريم أساس" className="bg-white/60 border-pink-100 rounded-xl text-right" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-right">
              <div className="grid gap-2">
                <Label htmlFor="price" className="text-pink-600 font-bold text-xs uppercase">السعر ($)</Label>
                <Input id="price" type="number" className="bg-white/60 border-pink-100 rounded-xl" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label className="text-pink-600 font-bold text-xs uppercase">القسم</Label>
                <select className="flex h-10 w-full rounded-xl border border-pink-100 bg-white/60 px-3 py-2 text-sm text-pink-900 focus:outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.filter(c => c.id !== "all").map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2 text-right">
              <Label htmlFor="desc" className="text-pink-600 font-bold text-xs uppercase">وصف المنتج</Label>
              <Textarea id="desc" placeholder="أضف تفاصيل المنتج هنا..." className="bg-white/60 border-pink-100 rounded-xl min-h-[80px] text-right" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button onClick={handleSubmit} disabled={loading || !name || tempImages.length === 0} className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-[10px]">
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {loading ? "جاري المعالجة والرفع..." : "نشر للمتجر الآن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
