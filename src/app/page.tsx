
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingBag, Volume2, VolumeX, PlusCircle, X, Trash2, Settings2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ServiceCard, MakeupService } from '@/components/ServiceCard';
import { AddServiceDialog } from '@/components/AddServiceDialog';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, firebaseConfig, useFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export default function GirlsStore() {
  const { toast } = useToast();
  const db = useFirestore();
  const { auth } = useFirebase();
  
  const [mounted, setMounted] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [cart, setCart] = useState<{ service: MakeupService, quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
    }
  }, [auth]);

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
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds * 1000) || Date.now();
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds * 1000) || Date.now();
      return timeB - timeA;
    });
  }, [dbProductsRaw]);

  const categoriesList = useMemo(() => {
    const base = [{ id: "all", name: "الكل - All" }];
    return [...base, ...dbCategories];
  }, [dbCategories]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + ((item.service?.price || 0) * item.quantity), 0);
  }, [cart]);

  const filteredServices = useMemo(() => {
    if (!dbProducts) return [];
    if (selectedCategoryId === "all") return dbProducts as MakeupService[];
    return (dbProducts as MakeupService[]).filter(s => s.categoryId === selectedCategoryId);
  }, [dbProducts, selectedCategoryId]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (clickCount === 7) {
      setIsPasswordDialogOpen(true);
      setClickCount(0);
    }
  }, [clickCount]);

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

  const handlePasswordSubmit = () => {
    if (passwordInput === "Hassan@GS#7") {
      setIsSupervisor(true);
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
      toast({ title: "ADMIN ACCESS GRANTED" });
    } else {
      toast({ variant: "destructive", title: "INVALID PASSWORD" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    try {
      await setDocumentNonBlocking(doc(db, 'categories', newId), { id: newId, name: newCategoryName.trim() }, { merge: true });
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
      toast({ title: "New Section Added" });
    } catch (e) {
      console.error("Category Add Error:", e);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteDocumentNonBlocking(doc(db, 'categories', catId));
      if (selectedCategoryId === catId) {
        setSelectedCategoryId("all");
      }
      toast({ title: "Section Deleted Successfully" });
    } catch (e) {
      console.error("Category Delete Error:", e);
      toast({ variant: "destructive", title: "Error Deleting Section" });
    }
  };

  const addToCart = (service: MakeupService) => {
    setCart(prev => {
      const existing = prev.find(item => item.service?.id === service.id);
      if (existing) return prev.map(item => item.service?.id === service.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { service, quantity: 1 }];
    });
    toast({ title: "Added to Bag", description: service.name });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col pb-20 overflow-x-hidden selection:bg-pink-100">
      <audio ref={audioRef} loop preload="auto" src="https://cdn.pixabay.com/audio/2025/01/21/audio_18c5e9f854.mp3" />

      <nav className={cn("fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 h-16 md:h-28 flex items-center justify-between transition-all duration-500", "glass border-b border-pink-200/30", isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full")}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-display text-lg md:text-2xl font-black text-[#d41c73] cursor-pointer flex flex-col leading-[0.8]">
          <span>GIRLS</span>
          <span>STORE<span className="text-[#f472b6]">.</span></span>
        </div>
        <p className="text-[14px] md:text-[24px] font-black uppercase animate-shimmer-rays tracking-widest whitespace-nowrap">POWERED BY HASSAN DEEB</p>
      </nav>

      <header className="pt-16 md:pt-20 pb-8 px-4 text-center">
        <p className="text-[18px] md:text-[32px] font-black uppercase animate-shimmer-rays mb-4">POWERED BY HASSAN DEEB</p>
        <h1 onClick={handleAdminTrigger} className="font-display text-[60px] md:text-[140px] font-black leading-[0.85] text-[#d41c73] cursor-pointer">
          <span className="block">GIRLS</span>
          <span className="block">STORE<span className="text-[#f472b6]">.</span></span>
        </h1>

        <nav className="flex overflow-x-auto pb-4 no-scrollbar gap-2 px-2 justify-start md:justify-center mt-8">
          {categoriesList.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={cn("whitespace-nowrap px-6 py-2 rounded-full text-[10px] uppercase font-semibold transition-all border", selectedCategoryId === cat.id ? "bg-pink-500 text-white border-pink-500" : "bg-white/80 text-pink-400 border-pink-100")}>
              {cat.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 md:px-8 py-4 w-full">
        {isSupervisor && (
          <div className="glass p-8 rounded-[3rem] mb-12 flex flex-col items-center gap-6 border-pink-200">
            <h3 className="font-headline text-xl uppercase font-bold text-pink-700">Admin Controls</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <AddServiceDialog categories={categoriesList} selectedCategoryId={selectedCategoryId} />
              <Button onClick={() => setIsAddCategoryOpen(true)} variant="outline" className="rounded-full bg-white text-[10px] uppercase h-12 px-8 text-pink-700">New Section</Button>
              <Button onClick={() => setIsManageCategoriesOpen(true)} variant="outline" className="rounded-full bg-white text-[10px] uppercase h-12 px-8 text-pink-700 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Manage Sections
              </Button>
              <Button onClick={() => setIsSupervisor(false)} variant="ghost" className="text-pink-400">Exit Admin</Button>
            </div>
          </div>
        )}

        {(isCatsLoading || isProductsLoading) ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
            {filteredServices.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                isSupervisor={isSupervisor} 
                onUpdate={(u) => updateDocumentNonBlocking(doc(db, 'products', u.id), u)} 
                onDelete={(id) => deleteDocumentNonBlocking(doc(db, 'products', id))} 
                onAddToCart={() => addToCart(service)} 
              />
            ))}
          </div>
        )}
      </main>

      <Button onClick={toggleMusic} className="fixed bottom-6 left-6 h-12 w-12 rounded-full glass text-pink-500 shadow-xl z-50">
        {isMusicPlaying ? <Volume2 /> : <VolumeX />}
      </Button>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-pink-500 text-white shadow-2xl z-50 hover:bg-pink-600 transition-transform active:scale-95">
            <div className="relative">
              <ShoppingBag className="w-8 h-8" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-pink-500 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-pink-500">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent className="glass border-pink-100 w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-pink-100">
            <SheetTitle className="font-display text-2xl text-pink-600 uppercase">Your Bag</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow p-6">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 text-pink-100 mx-auto mb-4" />
                <p className="text-pink-300 uppercase text-xs font-bold">Your bag is empty</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 relative">
                      <img src={item.service?.imageUrls?.[0] || 'https://placehold.co/100'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-display text-sm text-pink-900 uppercase font-black">{item.service?.name}</h4>
                      <p className="text-pink-500 font-bold text-xs">${item.service?.price} × {item.quantity}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-pink-200 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {cart.length > 0 && (
            <div className="p-6 bg-white/80 border-t border-pink-100 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-pink-400 text-xs font-bold uppercase">Total Amount</span>
                <span className="text-pink-600 font-display text-3xl font-black">${cartTotal}</span>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest text-xs">
                Checkout Now
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <footer className="py-20 text-center border-t border-pink-100 bg-white/30">
        <p className="text-pink-400 uppercase tracking-widest font-bold text-[14px] md:text-[22px] mb-8">WHISH MONEY / CASH ON DELIVERY</p>
        <p className="text-[12px] md:text-[18px] font-black text-pink-900 px-4 whitespace-nowrap tracking-tight">© 2026 GIRLS STORE • BY HASSAN DEEB</p>
      </footer>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="glass border-pink-200">
          <DialogHeader><DialogTitle>Admin Access</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} 
              className="rounded-xl border-pink-100"
            />
            <Button onClick={handlePasswordSubmit} className="w-full bg-pink-500 h-12 rounded-xl uppercase font-bold">Verify Access</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="glass border-pink-200">
          <DialogHeader><DialogTitle>New Section</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Section Name (e.g. Face, Lips...)" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              className="rounded-xl border-pink-100"
            />
            <Button onClick={handleAddCategory} className="w-full bg-pink-500 h-12 rounded-xl uppercase font-bold">Create Section</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageCategoriesOpen} onOpenChange={setIsManageCategoriesOpen}>
        <DialogContent className="glass border-pink-200 sm:max-w-md">
          <DialogHeader><DialogTitle className="text-pink-700">Manage Sections</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] py-4">
            <div className="space-y-3">
              {dbCategories.length === 0 ? (
                <p className="text-center text-pink-300 py-10 uppercase text-xs font-bold">No custom sections found</p>
              ) : (
                dbCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-pink-50">
                    <span className="font-bold text-pink-900">{cat.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-pink-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
