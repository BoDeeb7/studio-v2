"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Instagram, Zap, Lock, ShoppingBag, LogOut, X, Wallet, User, PlusCircle, Volume2, VolumeX, Edit2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ServiceCard, MakeupService } from '@/components/ServiceCard';
import { AIGeneratorDialog } from '@/components/AIGeneratorDialog';
import { AddServiceDialog } from '@/components/AddServiceDialog';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, serverTimestamp } from 'firebase/firestore';

export default function GirlsStore() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydration Protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time Queries
  const categoriesQuery = useMemoFirebase(() => query(collection(db, 'categories')), [db]);
  const { data: dbCategoriesRaw, isLoading: isCatsLoading } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => query(collection(db, 'products')), [db]);
  const { data: dbProductsRaw, isLoading: isProductsLoading } = useCollection(productsQuery);

  const dbCategories = useMemo(() => {
    if (!dbCategoriesRaw) return [];
    return [...dbCategoriesRaw].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [dbCategoriesRaw]);

  const dbProducts = useMemo(() => {
    if (!dbProductsRaw) return [];
    return [...dbProductsRaw].sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return timeB - timeA;
    });
  }, [dbProductsRaw]);

  const categories = useMemo(() => {
    const base = [{ id: "all", name: "الكل - All" }];
    return [...base, ...dbCategories];
  }, [dbCategories]);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<{id: string, name: string} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const [cart, setCart] = useState<{ service: MakeupService, quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'whish'>('cash');
  const [customerName, setCustomerName] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setIsMusicPlaying(true)).catch(() => {});
    } else {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    }
  };

  const handleAdminTrigger = () => {
    if (isSupervisor) return;
    setClickCount(prev => prev + 1);
  };

  useEffect(() => {
    if (clickCount === 7) {
      setIsPasswordDialogOpen(true);
      setClickCount(0);
    }
  }, [clickCount]);

  if (!mounted) return null; // Prevent hydration crash

  const handlePasswordSubmit = () => {
    if (passwordInput === "Hassan@GS#7") {
      setIsSupervisor(true);
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
      toast({ title: "ACCESS GRANTED", description: "Admin session active." });
    } else {
      toast({ variant: "destructive", title: "ACCESS DENIED" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    try {
      await setDocumentNonBlocking(doc(db, 'categories', newId), { id: newId, name: newCategoryName.trim() }, { merge: true });
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    } catch (e) {}
  };

  const handleEditCategory = async () => {
    if (!categoryToEdit || !newCategoryName.trim()) return;
    try {
      await updateDocumentNonBlocking(doc(db, 'categories', categoryToEdit.id), { name: newCategoryName.trim() });
      setNewCategoryName("");
      setCategoryToEdit(null);
      setIsEditCategoryOpen(false);
    } catch (e) {}
  };

  const addToCart = (service: MakeupService) => {
    setCart(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) return prev.map(item => item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { service, quantity: 1 }];
    });
    toast({ title: "Added to Bag", description: service.name });
  };

  const cartTotal = cart.reduce((total, item) => total + ((item.service.price || 0) * item.quantity), 0);

  const filteredServices = useMemo(() => {
    if (!dbProducts) return [];
    if (selectedCategoryId === "all") return dbProducts as MakeupService[];
    return (dbProducts as MakeupService[]).filter(s => s.categoryId === selectedCategoryId);
  }, [dbProducts, selectedCategoryId]);

  return (
    <div className="min-h-screen flex flex-col pb-20 overflow-x-hidden selection:bg-pink-100">
      <audio ref={audioRef} loop preload="auto" src="https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3" />

      {/* Persistent Nav */}
      <nav className={cn("fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 h-16 md:h-28 flex items-center justify-between transition-all duration-500", "glass border-b border-pink-200/30", isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full")}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-display text-lg md:text-2xl font-black text-[#d41c73] cursor-pointer flex flex-col leading-[0.8]">
          <span>GIRLS</span>
          <span>STORE<span className="text-[#f472b6]">.</span></span>
        </div>
        <p className="text-[12px] md:text-[20px] font-black uppercase animate-shimmer-rays tracking-widest">POWERED BY HASSAN DEEB</p>
      </nav>

      <header className="pt-16 md:pt-20 pb-8 px-4 text-center">
        <p className="text-[14px] md:text-[28px] font-black uppercase animate-shimmer-rays mb-4">POWERED BY HASSAN DEEB</p>
        <h1 onClick={handleAdminTrigger} className="font-display text-[60px] md:text-[140px] font-black leading-[0.85] text-[#d41c73] cursor-pointer">
          <span className="block">GIRLS</span>
          <span className="block">STORE<span className="text-[#f472b6]">.</span></span>
        </h1>

        <nav className="flex overflow-x-auto pb-4 no-scrollbar gap-2 px-2 justify-start md:justify-center mt-8">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={cn("whitespace-nowrap px-6 py-2 rounded-full text-[10px] uppercase font-semibold transition-all border", selectedCategoryId === cat.id ? "bg-pink-500 text-white border-pink-500" : "bg-white/80 text-pink-400 border-pink-100")}>
              {cat.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 md:px-8 py-4 w-full">
        {isSupervisor && (
          <div className="glass p-8 rounded-[3rem] mb-12 flex flex-col items-center gap-6 border-pink-200">
            <h3 className="font-headline text-xl uppercase font-bold text-pink-700">Admin Mode</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <AddServiceDialog categories={categories} selectedCategoryId={selectedCategoryId} />
              <Button onClick={() => setIsAddCategoryOpen(true)} variant="outline" className="rounded-full bg-white text-[10px] uppercase h-12 px-8 text-pink-700">New Section</Button>
              <Button onClick={() => setIsSupervisor(false)} variant="ghost" className="text-pink-400">Exit Admin</Button>
            </div>
          </div>
        )}

        {(isCatsLoading || isProductsLoading) ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} isSupervisor={isSupervisor} onUpdate={(u) => updateDocumentNonBlocking(doc(db, 'products', u.id), u)} onDelete={(id) => deleteDocumentNonBlocking(doc(db, 'products', id))} onAddToCart={() => addToCart(service)} />
            ))}
          </div>
        )}
      </main>

      <Button onClick={toggleMusic} className="fixed bottom-6 left-6 h-12 w-12 rounded-full glass text-pink-500 shadow-xl z-50">
        {isMusicPlaying ? <Volume2 /> : <VolumeX />}
      </Button>

      <footer className="py-20 text-center border-t border-pink-100 bg-white/30">
        <p className="text-pink-400 uppercase tracking-widest font-bold text-[12px] md:text-[18px] mb-8">WHISH MONEY / CASH ON DELIVERY</p>
        <p className="text-[12px] md:text-[18px] font-black text-pink-900 px-4">© 2026 GIRLS STORE • BY HASSAN DEEB</p>
      </footer>

      {/* Admin Dialogs */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="glass border-pink-200">
          <DialogHeader><DialogTitle>Admin Access</DialogTitle></DialogHeader>
          <Input type="password" placeholder="••••••••" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
          <Button onClick={handlePasswordSubmit} className="bg-pink-500">Verify</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
