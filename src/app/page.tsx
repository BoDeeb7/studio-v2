
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
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';

export default function GirlsStore() {
  const { toast } = useToast();
  const db = useFirestore();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Firestore Collections
  const categoriesQuery = useMemoFirebase(() => query(collection(db, 'categories'), orderBy('name', 'asc')), [db]);
  const { data: dbCategories, isLoading: isCatsLoading } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => query(collection(db, 'products'), orderBy('createdAt', 'desc')), [db]);
  const { data: dbProducts, isLoading: isProductsLoading } = useCollection(productsQuery);

  const categories = useMemo(() => {
    const base = [{ id: "all", name: "الكل - All" }];
    if (!dbCategories) return base;
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);

    const handleFirstInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsMusicPlaying(true);
        }).catch(() => {});
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsMusicPlaying(true)).catch(console.error);
    } else {
      audio.pause();
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

  const handlePasswordSubmit = () => {
    if (passwordInput === "Hassan@GS#7") {
      setIsSupervisor(true);
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
      toast({ title: "ACCESS GRANTED", description: "Hassan Deeb Studio controls active." });
    } else {
      toast({ variant: "destructive", title: "ACCESS DENIED", description: "Incorrect password." });
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsSupervisor(false);
    toast({ title: "LOGGED OUT", description: "Admin session closed." });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    if (categories.find(c => c.id === newId)) {
      toast({ variant: "destructive", title: "Category Exists" });
      return;
    }
    
    setDocumentNonBlocking(doc(db, 'categories', newId), {
      id: newId,
      name: newCategoryName.trim()
    }, { merge: true });

    setNewCategoryName("");
    setIsAddCategoryOpen(false);
    toast({ title: "Section Added", description: "Saved to database." });
  };

  const handleEditCategory = () => {
    if (!categoryToEdit || !newCategoryName.trim()) return;
    
    updateDocumentNonBlocking(doc(db, 'categories', categoryToEdit.id), {
      name: newCategoryName.trim()
    });

    setNewCategoryName("");
    setCategoryToEdit(null);
    setIsEditCategoryOpen(false);
    toast({ title: "Section Updated", description: "Saved to database." });
  };

  const openEditCategory = (cat: {id: string, name: string}) => {
    setCategoryToEdit(cat);
    setNewCategoryName(cat.name);
    setIsEditCategoryOpen(true);
  };

  const addToCart = (service: MakeupService) => {
    setCart(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        return prev.map(item => item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { service, quantity: 1 }];
    });
    toast({ title: "Added to Bag", description: `${service.name} added.` });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.service.id !== id));
  };

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.service.price * item.quantity), 0), [cart]);

  const sendOrderWhatsApp = () => {
    if (!customerName.trim()) return;
    const phoneNumber = "96176511272";
    const paymentStr = paymentMethod === 'whish' ? "Whish Money (+96176511272)" : "Cash on Delivery";
    let message = `*طلب جديد من Girls Store*\n\n*الاسم:* ${customerName}\n--------------------------\n`;
    cart.forEach(item => { message += `- ${item.service.name} (x${item.quantity}) = $${item.service.price * item.quantity}\n`; });
    message += `--------------------------\n*المجموع الكلي: $${cartTotal}*\n*طريقة الدفع:* ${paymentStr}\n\n*Hassan Deeb @ Deeb Data*`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const addNewService = (newServiceData: MakeupService | Omit<MakeupService, 'id'>) => {
    addDocumentNonBlocking(collection(db, 'products'), {
      ...newServiceData,
      createdAt: new Date().toISOString()
    });
    toast({ title: "Product Added", description: "Saved to database." });
  };

  const updateService = (updated: MakeupService) => {
    updateDocumentNonBlocking(doc(db, 'products', updated.id), {
      name: updated.name,
      price: updated.price,
      description: updated.description,
      imageUrls: updated.imageUrls,
      categoryId: updated.categoryId
    });
    toast({ title: "Product Updated", description: "Changes saved." });
  };

  const deleteService = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'products', id));
    toast({ title: "Product Deleted", description: "Removed from database." });
  };

  const filteredServices = useMemo(() => {
    if (!dbProducts) return [];
    if (selectedCategoryId === "all") return dbProducts as MakeupService[];
    return (dbProducts as MakeupService[]).filter(s => s.categoryId === selectedCategoryId);
  }, [dbProducts, selectedCategoryId]);

  return (
    <div className="min-h-screen flex flex-col pb-20 overflow-x-hidden selection:bg-pink-100">
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
      />

      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 h-16 md:h-28 flex items-center justify-between transition-all duration-500 ease-in-out",
          "glass border-b border-pink-200/30",
          isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
        )}
      >
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display text-lg md:text-2xl font-black text-[#d41c73] cursor-pointer flex flex-col leading-[0.8] tracking-tighter"
        >
          <span>GIRLS</span>
          <span>STORE<span className="text-[#f472b6]">.</span></span>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-[10px] md:text-xs font-black uppercase animate-shimmer-rays leading-none tracking-widest whitespace-nowrap">
            POWERED BY HASSAN DEEB
          </p>
          <div className="h-[1px] md:h-[2px] w-full mt-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
        </div>
      </nav>

      <header className="pt-16 md:pt-20 pb-8 px-4 text-center">
        <div className="w-full mb-8 md:mb-12 flex flex-col justify-center items-center gap-1">
          <p className="text-[12px] md:text-[14px] tracking-[0.05em] font-black uppercase animate-shimmer-rays leading-tight whitespace-nowrap">
            POWERED BY HASSAN DEEB
          </p>
          <div className="h-[2px] md:h-[3px] w-32 md:w-64 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
        </div>

        <div className="flex flex-col items-center mb-6 md:mb-10">
           <h1
            onClick={handleAdminTrigger}
            className="font-display text-[60px] md:text-[140px] font-black leading-[0.85] tracking-[-0.05em] cursor-pointer select-none text-[#d41c73] transition-transform active:scale-95 flex flex-col items-center justify-center text-center py-4 md:py-6"
          >
            <span className="block">GIRLS</span>
            <span className="block relative">
              STORE<span className="text-[#f472b6]">.</span>
            </span>
          </h1>
        </div>

        <nav className="flex overflow-x-auto pb-4 no-scrollbar gap-2 px-2 justify-start md:justify-center mt-4">
          {categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "whitespace-nowrap px-4 md:px-6 py-2 rounded-full text-[10px] md:text-[11px] uppercase tracking-widest font-semibold transition-all border flex items-center gap-2",
                  selectedCategoryId === cat.id
                    ? "bg-pink-500 text-white border-pink-500 shadow-lg"
                    : "bg-white/80 text-pink-400 border-pink-100 hover:bg-pink-50"
                )}
              >
                {cat.name}
                {isSupervisor && cat.id !== "all" && (
                  <Edit2 
                    className="w-3 h-3 text-white/70 hover:text-white" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCategory(cat);
                    }} 
                  />
                )}
              </button>
            </div>
          ))}
        </nav>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8 w-full">
        {isSupervisor && (
          <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] mb-8 md:mb-12 flex flex-col items-center gap-4 md:gap-6 border-pink-200 relative max-w-2xl mx-auto">
            <Button onClick={handleLogout} variant="ghost" className="absolute top-2 right-2 md:top-4 md:right-4 text-pink-400" size="sm">
              <LogOut className="w-4 h-4 mr-2" /> Exit
            </Button>
            <h3 className="font-headline text-lg md:text-xl uppercase font-bold text-pink-700">Admin Active</h3>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              <AIGeneratorDialog onGenerated={(name, desc) => addNewService({ name, description: desc, price: 45, imageUrls: ["https://picsum.photos/seed/new/600/600"], categoryId: selectedCategoryId === "all" ? "face" : selectedCategoryId })} />
              <AddServiceDialog onAdd={addNewService} categories={categories} selectedCategoryId={selectedCategoryId} />
              <Button onClick={() => setIsAddCategoryOpen(true)} variant="outline" className="rounded-full bg-white text-[9px] md:text-[10px] uppercase tracking-widest h-10 px-4 md:px-6 text-pink-700 border-pink-100">
                <PlusCircle className="w-4 h-4 mr-2" /> New Section
              </Button>
            </div>
          </div>
        )}

        {(isCatsLoading || isProductsLoading) ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSupervisor={isSupervisor}
                  onUpdate={updateService}
                  onDelete={deleteService}
                  onAddToCart={() => addToCart(service)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 glass rounded-[2rem] md:rounded-[3rem]">
                <p className="text-pink-300 uppercase tracking-widest text-[10px] md:text-xs font-bold">No items in this category yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Button
        onClick={toggleMusic}
        className="fixed bottom-6 left-6 h-12 w-12 rounded-full glass text-pink-500 shadow-xl z-50 hover:bg-white transition-all group border-pink-200"
      >
        {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </Button>

      {/* New Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[400px] glass border-pink-200">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl uppercase text-pink-700">Create New Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Section Name (e.g. Nails)"
              className="bg-white border-pink-100 rounded-2xl"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="w-full rounded-2xl bg-pink-500 uppercase font-bold text-[11px] tracking-widest">
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="sm:max-w-[400px] glass border-pink-200">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl uppercase text-pink-700">Rename Section</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="New Section Name"
              className="bg-white border-pink-100 rounded-2xl"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditCategory()}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleEditCategory} disabled={!newCategoryName.trim()} className="w-full rounded-2xl bg-pink-500 uppercase font-bold text-[11px] tracking-widest">
              Update Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isSupervisor && (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 md:h-16 md:w-16 rounded-full bg-pink-500 text-white shadow-2xl z-50 hover:scale-105 transition-transform">
              <div className="relative">
                <ShoppingBag className="w-6 h-6 md:w-7 md:h-7" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-pink-500 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-pink-500">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent className="glass border-pink-200 sm:max-w-md overflow-y-auto no-scrollbar">
            <SheetHeader>
              <SheetTitle className="font-headline text-2xl uppercase font-bold text-pink-600">Your Bag</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-auto mt-8 pr-4 mb-6">
              {cart.length === 0 ? (
                <p className="text-center py-20 text-pink-300 text-[11px] uppercase font-bold tracking-widest">Empty Bag.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.service.id} className="flex gap-4 items-center bg-white/60 p-3 rounded-2xl border border-pink-100">
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative"><img src={item.service.imageUrls[0]} className="object-cover w-full h-full" alt="" /></div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-pink-900 text-xs">{item.service.name}</h4>
                        <p className="text-pink-500 font-bold text-[10px]">${item.service.price} x {item.quantity}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.service.id)} className="text-pink-200"><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {cart.length > 0 && (
              <div className="space-y-6 pb-20">
                <div className="p-4 bg-white/60 rounded-2xl border border-pink-100 space-y-4">
                   <Label className="text-pink-600 font-bold uppercase text-[9px] flex items-center gap-2"><User className="w-3 h-3" /> Full Name</Label>
                   <Input placeholder="أدخل اسمك هنا..." className="bg-white rounded-xl" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="p-4 bg-white/60 rounded-2xl border border-pink-100 space-y-4">
                  <Label className="text-pink-600 font-bold uppercase text-[9px] flex items-center gap-2"><Wallet className="w-3 h-3" /> Payment Method</Label>
                  <RadioGroup defaultValue="cash" onValueChange={(v) => setPaymentMethod(v as any)} className="grid gap-2">
                    <div className={cn("flex items-center space-x-3 p-3 rounded-xl border", paymentMethod === 'cash' ? "bg-pink-50 border-pink-200" : "bg-transparent border-transparent")}>
                      <RadioGroupItem value="cash" id="cash" /><Label htmlFor="cash" className="text-pink-700 text-[11px] font-bold cursor-pointer">Cash on Delivery</Label>
                    </div>
                    <div className={cn("flex items-center space-x-3 p-3 rounded-xl border", paymentMethod === 'whish' ? "bg-pink-50 border-pink-200" : "bg-transparent border-transparent")}>
                      <RadioGroupItem value="whish" id="whish" /><Label htmlFor="whish" className="text-pink-700 text-[11px] font-bold cursor-pointer">Whish Money</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-pink-400 uppercase text-[10px] font-bold tracking-widest">Total</span>
                    <span className="text-pink-600 font-headline text-2xl font-bold">${cartTotal}</span>
                  </div>
                  <Button onClick={sendOrderWhatsApp} disabled={!customerName.trim()} className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest bg-pink-500 text-white shadow-lg">Send to WhatsApp</Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      <footer className="py-20 text-center border-t border-pink-100 bg-white/30">
        <p className="text-pink-400 uppercase tracking-[0.4em] font-bold text-[11px] mb-8">WHISH MONEY / CASH ON DELIVERY</p>
        <div className="flex justify-center gap-12 mb-12 text-pink-500">
          <Instagram size={28} className="hover:scale-110 hover:text-pink-600 transition-all cursor-pointer" onClick={() => window.open('https://www.instagram.com/girls_store_520?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', '_blank')} />
          <Zap size={28} />
        </div>
        <p className="text-[9px] md:text-[13px] uppercase tracking-[0.1em] md:tracking-[0.4em] font-bold text-pink-900 whitespace-nowrap px-4 overflow-hidden">
          © 2026 GIRLS STORE • BY HASSAN DEEB
        </p>
      </footer>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px] glass border-pink-200">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl uppercase text-pink-700">Admin Access</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <Input
                type="password"
                placeholder="••••••••"
                className="pl-10 h-12 bg-white border-pink-100 rounded-2xl"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
          </div>
          <DialogFooter><Button onClick={handlePasswordSubmit} className="w-full h-12 rounded-2xl bg-pink-500 uppercase font-bold text-[11px] tracking-widest">Verify Access</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
