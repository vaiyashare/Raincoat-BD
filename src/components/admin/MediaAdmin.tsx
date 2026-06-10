import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Trash2, Image, ChevronUp, ChevronDown, Check, 
  AlertCircle, RefreshCw, Plus, Edit, Sparkles, HelpCircle 
} from 'lucide-react';
import { MediaItem } from '../../types';
import { 
  getMediaFromFirestore, 
  saveMediaToFirestore, 
  deleteMediaFromFirestore 
} from '../../lib/firebase';
import { compressImage } from '../../lib/imageCompressor';

// Static fallbacks as imported standard image pointers
import navyRaincoatImg from '../../assets/images/navy_raincoat_1780660053988.png';
import blackRaincoatImg from '../../assets/images/black_raincoat_1780660074069.png';
import seamSealingImg from '../../assets/images/raincoat_seam_sealing_1780660091277.png';
import wristCuffsImg from '../../assets/images/raincoat_wrist_cuffs_1780660107193.png';
import actionImg from '../../assets/images/navy_raincoat_action_1780660126544.png';

interface MediaAdminProps {
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function MediaAdmin({ userRole }: MediaAdminProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('নতুন');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [pageInput, setPageInput] = useState<'raincoat' | 'bikecover'>('raincoat');
  const [filterTab, setFilterTab] = useState<'all' | 'raincoat' | 'bikecover'>('all');

  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Custom non-blocking confirmations state to bypass cross-origin iframe sandbox blocks
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default initial slides array in case Firestore is empty
  const defaultSlides: MediaItem[] = [
    {
      id: 'slide-1',
      url: navyRaincoatImg,
      title: 'প্রিমিয়াম নেভি ব্লু কালার',
      tag: 'নেভি ব্লু',
      description: 'ক্যাপসহ প্রিমিয়াম ২-পিস জ্যাকেট ও জুতো কাভারসহ ট্রাউজার সেট',
      orderIndex: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'slide-2',
      url: blackRaincoatImg,
      title: 'প্রিমিয়াম জেট ব্ল্যাক কালার',
      tag: 'কালো',
      description: ' can- fit any outfit perfectly',
      orderIndex: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 'slide-3',
      url: actionImg,
      title: 'রেইনকোটটির বাস্তব ফিটিং লুক',
      tag: 'স্মার্ট ডিজাইন',
      description: 'যেকোনো পোশাকে সহজেই ফিট করে, হালকা এবং শতভাগ স্বাচ্ছন্দ্যময়',
      orderIndex: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: 'slide-4',
      url: seamSealingImg,
      title: '১০০% লিকপ্রুফ সীমিং প্রযুক্তি',
      tag: 'ওয়াটারপ্রুফ গিয়ার',
      description: 'রেইনকোটের ভেতরের প্রতিটি সেলাই জয়েন্ট পিইউ টেপ দ্বারা সিল করা',
      orderIndex: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: 'slide-5',
      url: wristCuffsImg,
      title: 'ভেলক্রো এডজাস্টেবল রিস্ট কাফ',
      tag: 'ফিটিং লুক',
      description: 'হাতে পানি প্রবেশ করা সম্পূর্ণ আটকাতে ইলাস্টিক বর্ডার প্লাস ভেলক্রো বেল্ট',
      orderIndex: 5,
      createdAt: new Date().toISOString()
    }
  ];

  // Custom states for the "আজকের অফারে যা পাচ্ছেন" Offer image config
  const [bundleOfferImg, setBundleOfferImg] = useState<string>(() => {
    return localStorage.getItem('raincoat_bundle_offer_image') || '';
  });
  const [bundleOfferFileLoading, setBundleOfferFileLoading] = useState(false);
  const [bundleSuccess, setBundleSuccess] = useState('');
  const [bundleError, setBundleError] = useState('');
  const bundleFileInputRef = useRef<HTMLInputElement>(null);

  // Custom Live Videos state managers
  const [liveVideos, setLiveVideos] = useState<MediaItem[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoPage, setVideoPage] = useState<'raincoat' | 'bikecover'>('raincoat');
  const [videoSuccess, setVideoSuccess] = useState('');
  const [videoError, setVideoError] = useState('');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const fetchLiveVideos = async () => {
    try {
      const mediaList = await getMediaFromFirestore();
      const filtered = mediaList.filter(item => String(item.id).startsWith('live-video-'));
      if (filtered.length > 0) {
        setLiveVideos(filtered);
        localStorage.setItem('raincoat_live_videos', JSON.stringify(filtered));
      } else {
        const cached = localStorage.getItem('raincoat_live_videos');
        if (cached) {
          setLiveVideos(JSON.parse(cached));
        } else {
          // Fallback static defaults
          const defaults: MediaItem[] = [
            {
              id: 'live-video-default-1',
              url: 'https://www.facebook.com/reel/1471402964313008/',
              title: 'লাইভ ওয়াটার রেসিস্ট্যান্স টেস্ট',
              tag: 'LiveVideo',
              orderIndex: 1,
              createdAt: new Date().toISOString()
            },
            {
              id: 'live-video-default-2',
              url: 'https://www.facebook.com/reel/2183474582444791/',
              title: 'হিট সিলিং ও রেইনপ্রুফ ডেমো',
              tag: 'LiveVideo',
              orderIndex: 2,
              createdAt: new Date().toISOString()
            }
          ];
          setLiveVideos(defaults);
          localStorage.setItem('raincoat_live_videos', JSON.stringify(defaults));
        }
      }
    } catch (e) {
      console.warn("Could not load live videos:", e);
      const cached = localStorage.getItem('raincoat_live_videos');
      if (cached) setLiveVideos(JSON.parse(cached));
    }
  };

  // Synchronize the custom bundle offer image specifically on mount
  useEffect(() => {
    getMediaFromFirestore().then((mediaList) => {
      const found = mediaList.find(item => item.id === 'bundle-offer-image');
      if (found && found.url) {
        setBundleOfferImg(found.url);
        localStorage.setItem('raincoat_bundle_offer_image', found.url);
      }
    }).catch(err => {
      console.warn("Could not load bundle offer image in admin:", err);
    });

    fetchLiveVideos();
  }, []);

  const handleBundleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setBundleError('');
      setBundleSuccess('');
      
      const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validExtensions.includes(file.type)) {
        setBundleError('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
        return;
      }
      
      if (file.size > 1.5 * 1024 * 1024) {
        setBundleError('ইমেজের সাইজ অতিরিক্ত বড় (১.৫ মেগাবাইটের নীচে ইমেজ ট্রাই করুন)!');
        return;
      }

      setBundleOfferFileLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const urlData = event.target.result as string;
          try {
            localStorage.setItem('raincoat_bundle_offer_image', urlData);
            setBundleOfferImg(urlData);
            
            const newItem: MediaItem = {
              id: 'bundle-offer-image',
              url: urlData,
              title: 'Bundle Offer Cover',
              tag: 'Offer',
              description: 'আজকের অফারে যা পাচ্ছেন তার কভার ফটো',
              orderIndex: 999,
              createdAt: new Date().toISOString()
            };
            await saveMediaToFirestore(newItem);
            
            setBundleSuccess('আজকের অফারের ছবি সফলভাবে পরিবর্তন ও ডেটাবেসে সেভ করা হয়েছে!');
            window.dispatchEvent(new Event('raincoat_bundle_image_updated'));
            setTimeout(() => setBundleSuccess(''), 3000);
          } catch (err) {
            console.error(err);
            setBundleError('ছবিটি ডেটাবেসে সেভ করতে সমস্যা হয়েছে!');
          } finally {
            setBundleOfferFileLoading(false);
          }
        }
      };
      reader.onerror = () => {
        setBundleError('ফাইলটি পড়তে ত্রুটি হয়েছে!');
        setBundleOfferFileLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBundleUrlSubmit = async (urlStr: string) => {
    setBundleError('');
    setBundleSuccess('');
    if (!urlStr.trim()) {
      setBundleError('অনুগ্রহ করে একটি সঠিক ইমেজ লিংক প্রবেশ করুন!');
      return;
    }

    try {
      localStorage.setItem('raincoat_bundle_offer_image', urlStr.trim());
      setBundleOfferImg(urlStr.trim());

      const newItem: MediaItem = {
        id: 'bundle-offer-image',
        url: urlStr.trim(),
        title: 'Bundle Offer Cover',
        tag: 'Offer',
        description: 'আজকের অফারে যা পাচ্ছেন তার কভার ফটো',
        orderIndex: 999,
        createdAt: new Date().toISOString()
      };
      await saveMediaToFirestore(newItem);
      
      setBundleSuccess('সরাসরি ইমেজ লিংক সফলভাবে সেভ ও আপডেট করা হয়েছে!');
      window.dispatchEvent(new Event('raincoat_bundle_image_updated'));
      setTimeout(() => setBundleSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setBundleError('লিংকটি সেভ করতে সমস্যা হয়েছে!');
    }
  };

  const handleResetBundleImage = async () => {
    if (userRole === 'ReadOnly') {
      setBundleError('রিড-অনলি মোডে রিসেট করা সম্ভব নয়।');
      return;
    }
    setBundleError('');
    setBundleSuccess('');
    try {
      localStorage.removeItem('raincoat_bundle_offer_image');
      setBundleOfferImg('');
      await deleteMediaFromFirestore('bundle-offer-image');
      setBundleSuccess('আজকের অফার কভার ইমেজটি রিসেট করে ডিফল্ট ছবিতে ফ্ল্যাট করা হয়েছে!');
      window.dispatchEvent(new Event('raincoat_bundle_image_updated'));
      setTimeout(() => setBundleSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setBundleError('রিসেট করতে ব্যর্থ হয়েছে!');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoError('');
    setVideoSuccess('');
    if (!videoUrl.trim()) {
      setVideoError('অনুগ্রহ করে একটি সঠিক ভিডিও লিংক প্রবেশ করুন!');
      return;
    }

    setIsSavingVideo(true);
    try {
      const vidId = editingVideoId || `live-video-${Date.now()}`;
      const defaultTitle = videoTitle.trim() || `লাইভ ভিডিও #${liveVideos.length + 1}`;
      
      const newVideo: MediaItem = {
        id: vidId,
        url: videoUrl.trim(),
        title: defaultTitle,
        tag: 'LiveVideo',
        orderIndex: liveVideos.length + 1,
        createdAt: new Date().toISOString(),
        page: videoPage
      };

      await saveMediaToFirestore(newVideo);
      
      // Reload lists
      const updatedMediaList = await getMediaFromFirestore();
      const filtered = updatedMediaList.filter(item => String(item.id).startsWith('live-video-'));
      setLiveVideos(filtered);
      localStorage.setItem('raincoat_live_videos', JSON.stringify(filtered));

      setVideoSuccess(editingVideoId ? 'ভিডিও লিংকটি সফলভাবে আপডেট করা হয়েছে!' : 'নতুন ভিডিও লিংকটি সফলভাবে যোগ করা হয়েছে!');
      
      // Trigger update on frontend
      window.dispatchEvent(new Event('raincoat_live_videos_updated'));

      // Clear form
      setVideoUrl('');
      setVideoTitle('');
      setEditingVideoId(null);
      setVideoPage('raincoat');
      setTimeout(() => setVideoSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setVideoError('ভিডিও সেভ করতে সমস্যা হয়েছে!');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (userRole === 'ReadOnly') {
      setVideoError('রিড-অনলি মোডে ডিলিট করা সম্ভব নয়।');
      return;
    }
    setVideoError('');
    setVideoSuccess('');
    try {
      await deleteMediaFromFirestore(id);
      
      // Reload lists
      const updatedMediaList = await getMediaFromFirestore();
      const filtered = updatedMediaList.filter(item => String(item.id).startsWith('live-video-'));
      setLiveVideos(filtered);
      localStorage.setItem('raincoat_live_videos', JSON.stringify(filtered));

      setVideoSuccess('ভিডিও লিংকটি মুছে ফেলা হয়েছে!');
      window.dispatchEvent(new Event('raincoat_live_videos_updated'));
      setTimeout(() => setVideoSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setVideoError('ভিডিও ডিলিট করতে সমস্যা হয়েছে!');
    }
  };

  const handleEditVideo = (video: MediaItem) => {
    setEditingVideoId(video.id);
    setVideoUrl(video.url);
    setVideoTitle(video.title);
    setVideoPage(video.page || 'raincoat');
  };

  const handleCancelVideoEdit = () => {
    setEditingVideoId(null);
    setVideoUrl('');
    setVideoTitle('');
    setVideoPage('raincoat');
  };

  const loadMedia = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Load from localstorage if cached first
      const cached = localStorage.getItem('raincoat_media_gallery');
      if (cached) {
        setMediaItems(JSON.parse(cached).filter((item: any) => item.id !== 'bundle-offer-image' && !String(item.id).startsWith('live-video-')));
      }
      
      // 2. Fetch from Firestore database
      const dbMedia = await getMediaFromFirestore();
      if (dbMedia && dbMedia.length > 0) {
        setMediaItems(dbMedia.filter(item => item.id !== 'bundle-offer-image' && !String(item.id).startsWith('live-video-')));
        localStorage.setItem('raincoat_media_gallery', JSON.stringify(dbMedia));
      } else {
        // If Firestore results are completely empty, initialize default mock slides
        if (!cached) {
          setMediaItems(defaultSlides);
          localStorage.setItem('raincoat_media_gallery', JSON.stringify(defaultSlides));
         }
      }
    } catch (err) {
      console.error("Error loading media database files:", err);
      setErrorMsg("Firestore থেকে মিডিয়া লোড করা সম্ভব হয়নি। অফলাইন ক্যাশ সচল রয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setErrorMsg('');
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      setErrorMsg('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      if (uploadEvent.target?.result) {
        const rawResult = uploadEvent.target.result as string;
        try {
          const compressed = await compressImage(rawResult, 1000, 0.72);
          setImageUrl(compressed);
          setSuccessMsg('ইমেজ ফাইল সফলভাবে আপলোড ও কমপ্রেস করা হয়েছে!');
          setTimeout(() => setSuccessMsg(''), 2000);
        } catch (e) {
          setImageUrl(rawResult);
          setSuccessMsg('ইমেজ ফাইল সফলভাবে প্রসেস করা হয়েছে!');
          setTimeout(() => setSuccessMsg(''), 2000);
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg('ইমেজ ফাইলটি লোড করতে একটি ত্রুতি হয়েছে!');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (userRole === 'ReadOnly') {
      setErrorMsg('আপনার রিড-অনলি এক্সেস রয়েছে! ড্র্যাগ ও ড্রপ ব্লক করা হয়েছে।');
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processBgFile = (file: File) => {
    setErrorMsg('');
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      setErrorMsg('শুধুমাত্র JPG, PNG অথবা WEBP ইমেজ আপলোড করা যাবে!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      if (uploadEvent.target?.result) {
        const rawResult = uploadEvent.target.result as string;
        try {
          const compressed = await compressImage(rawResult, 1000, 0.72);
          setBgUrl(compressed);
          setSuccessMsg('ব্যাকগ্রাউন্ড ইমেজ সফলভাবে আপলোড ও কমপ্রেস করা হয়েছে!');
          setTimeout(() => setSuccessMsg(''), 2000);
        } catch (e) {
          setBgUrl(rawResult);
          setSuccessMsg('ব্যাকগ্রাউন্ড ইমেজ ফাইল সফলভাবে আপলোড করা হয়েছে!');
          setTimeout(() => setSuccessMsg(''), 2000);
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg('ব্যাকগ্রাউন্ড ইমেজ ফাইলটি লোড করতে একটি ত্রুটি হয়েছে!');
    };
    reader.readAsDataURL(file);
  };

  const handleBgFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processBgFile(files[0]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setTag('নতুন');
    setDescription('');
    setImageUrl('');
    setBgUrl('');
    setOrderIndex(mediaItems.length + 1);
    setPageInput('raincoat');
  };

  const handleSaveMediaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (userRole === 'ReadOnly') {
      setErrorMsg('আপনার রিড-অনলি রোল রয়েছে! ডাটা সেভ করতে পারবেন না।');
      return;
    }

    if (!imageUrl) {
      setErrorMsg('অনুগ্রহ করে একটি ইমেজ আপলোড করুন অথবা লিংক লিখুন!');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('অনগ্রহ করে স্লাইড শিরোনাম/টাইটেল লিখুন!');
      return;
    }

    const finalId = editingId || 'slide-' + Math.floor(Math.random() * 1000000);
    const newItem: MediaItem = {
      id: finalId,
      url: imageUrl,
      title: title.trim(),
      tag: tag.trim(),
      description: description.trim(),
      orderIndex: Number(orderIndex) || 0,
      createdAt: new Date().toISOString(),
      page: pageInput,
      bgUrl: bgUrl || ''
    };

    try {
      // Write locally first
      let updatedList: MediaItem[] = [];
      if (editingId) {
        updatedList = mediaItems.map(item => item.id === editingId ? { ...newItem } : item);
      } else {
        updatedList = [...mediaItems, newItem];
      }
      
      // Sort ascending index
      updatedList.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setMediaItems(updatedList);
      localStorage.setItem('raincoat_media_gallery', JSON.stringify(updatedList));

      // Sync to Cloud Firestore DB
      await saveMediaToFirestore(newItem);
      setSuccessMsg(editingId ? 'স্লাইড ইনফো আপডেট করা হয়েছে!' : 'নতুন স্লাইড সফলভাবে শোকেসে যোগ করা হয়েছে!');
      resetForm();
      
      // Global broadcast reload
      window.dispatchEvent(new Event('raincoat_carousel_updated'));
    } catch (err) {
      console.error(err);
      setErrorMsg('স্লাইড ডাটাবেস আপডেট ব্যর্থ। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const handleStartEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setTag(item.tag);
    setDescription(item.description || '');
    setImageUrl(item.url);
    setBgUrl(item.bgUrl || '');
    setOrderIndex(item.orderIndex);
    setPageInput(item.page || 'raincoat');
  };

  const handleDeleteItem = async (id: string) => {
    if (userRole === 'ReadOnly') {
      setErrorMsg('দুঃখিত! রিড-অনলি এক্সেস দিয়ে স্লাইড ডিলিট করা সম্ভব নয়।');
      return;
    }

    try {
      const filtered = mediaItems.filter(item => item.id !== id);
      setMediaItems(filtered);
      localStorage.setItem('raincoat_media_gallery', JSON.stringify(filtered));

      await deleteMediaFromFirestore(id);
      setSuccessMsg('ইমেজ স্লাইডটি সফলভাবে অপসারণ করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 2000);
      
      // Global state update trigger
      window.dispatchEvent(new Event('raincoat_carousel_updated'));
    } catch (err) {
      console.error(err);
      setErrorMsg('স্লাইড ডিলিট করতে সমস্যা হয়েছে!');
    }
  };

  const handleResetToDefaults = async () => {
    if (userRole === 'ReadOnly') {
      setErrorMsg('রিড-অনলি এক্সেস দিয়ে এটি সম্ভব নয়।');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Clear any current custom items from Firestore Database
      const deletePromises = mediaItems.map(item => 
        deleteMediaFromFirestore(item.id).catch(err => {
          console.warn(`Could not delete item ${item.id} during reset:`, err);
        })
      );
      await Promise.all(deletePromises);

      // 2. Upload all the base factory default slides to Firestore to ensure active sync
      const savePromises = defaultSlides.map(item => 
        saveMediaToFirestore(item).catch(err => {
          console.warn(`Could not save default item ${item.id} during reset:`, err);
        })
      );
      await Promise.all(savePromises);

      // 3. Update the local states and persist caches
      setMediaItems(defaultSlides);
      localStorage.setItem('raincoat_media_gallery', JSON.stringify(defaultSlides));
      setSuccessMsg('মিডিয়া গ্যালারি সফলভাবে রিস্টোর এবং ডাটাবেসে সিঙ্ক করা হয়েছে!');
      resetForm();
      
      // 4. Dispatch update broadcast for real-time frontend refresh
      window.dispatchEvent(new Event('raincoat_carousel_updated'));
    } catch (err) {
      console.error("Failed to restore default images to global database:", err);
      setErrorMsg('ডিফল্ট ইমেজ স্লাইডসমূহ রিস্টোর ও সিঙ্ক করতে সমস্যা হয়েছে!');
    } finally {
      setIsLoading(false);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (userRole === 'ReadOnly') return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mediaItems.length) return;

    const copy = [...mediaItems];
    // Swap order indices
    const tempIndex = copy[index].orderIndex;
    copy[index].orderIndex = copy[targetIdx].orderIndex;
    copy[targetIdx].orderIndex = tempIndex;

    // Sort again
    copy.sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Smooth visual indexes fix
    copy.forEach((item, idx) => {
      item.orderIndex = idx + 1;
    });

    setMediaItems(copy);
    localStorage.setItem('raincoat_media_gallery', JSON.stringify(copy));

    try {
      // Batch sync index updates to database
      for (const item of copy) {
        await saveMediaToFirestore(item);
      }
      window.dispatchEvent(new Event('raincoat_carousel_updated'));
    } catch (err) {
      console.warn("Firestore index drag sync failed:", err);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs sm:text-sm text-slate-800">
      
      {/* 🎁 "আজকের অফারে যা পাচ্ছেন" Cover Image Customizer Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="font-black text-amber-400 text-sm sm:text-base flex items-center gap-1.5">
              <span>🎁</span> “আজকের অফারে যা পাচ্ছেন” - কভার ইমেজ পরিবর্তন করুন
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-300 mt-1 font-sans">
              ল্যান্ডিং পেজের অফার সেকশনে যে রেইনকোটের বান্ডেল ছবি (জ্যাকেট + প্যান্ট + ব্যাগ) দেখায়, সেটি আপনি এখান থেকে আপলোড অথবা লিংক দিয়ে পরিবর্তন করতে পারবেন।
            </p>
          </div>
          {bundleOfferImg && (
            <button
              type="button"
              onClick={handleResetBundleImage}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-300 rounded-lg text-[10px] font-bold cursor-pointer transition shrink-0"
            >
              🔄 ডিফল্ট ছবিতে ফেরত যান
            </button>
          )}
        </div>

        {bundleError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            {bundleError}
          </div>
        )}

        {bundleSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            {bundleSuccess}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-5 items-stretch">
          {/* Current Display Preview */}
          <div className="w-full md:w-1/4 bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-800 shrink-0 relative min-h-[140px]">
            {bundleOfferImg ? (
              <div className="space-y-2 text-center">
                <img 
                  src={bundleOfferImg} 
                  alt="Offer Custom" 
                  className="max-h-[110px] object-contain mx-auto rounded"
                  referrerPolicy="no-referrer"
                />
                <span className="inline-block text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5">
                  বর্তমানে কাস্টম ছবি সচল
                </span>
              </div>
            ) : (
              <div className="space-y-1 text-center text-slate-500">
                <div className="text-xl sm:text-2xl text-center">🧥</div>
                <p className="text-[10px] font-bold">ডিফল্ট রেইনকোট ছবি সচল</p>
                <span className="text-[9px] block text-amber-400/80 font-semibold">(বর্তমানে মূল ৩ডি রেইনকোট বান্ডেল ইমেজ সচল আছে)</span>
              </div>
            )}
            {bundleOfferFileLoading && (
              <div className="absolute inset-0 bg-slate-950/85 rounded-xl flex items-center justify-center text-[10px] font-bold text-amber-400">
                <RefreshCw className="h-4 w-4 animate-spin mr-1" /> আপলোড হচ্ছে...
              </div>
            )}
          </div>

          {/* Interactive controls */}
          <div className="flex-1 space-y-3 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: File Upload */}
              <div className="bg-[#05131b] border border-cyan-950 p-4 rounded-xl flex flex-col justify-between space-y-3 text-left">
                <div>
                  <h4 className="text-xs font-extrabold text-[#00e3cd] uppercase tracking-wider">অপশন ১: কম্পিউটার বা মোবাইল থেকে ছবি বেছে নিন</h4>
                  <p className="text-[10px] text-slate-300 mt-1 font-sans">সরাসরি PNG, JPG বা WEBP ইমেজ ফাইল আপলোড করুন (১.৫ মেগাবাইটের কম রেজোলিউশন)।</p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={bundleFileInputRef}
                    accept="image/*"
                    onChange={handleBundleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bundleFileInputRef.current?.click()}
                    className="w-full py-2 bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    disabled={bundleOfferFileLoading || userRole === 'ReadOnly'}
                  >
                    <Upload className="h-3.5 w-3.5" /> ছবি আপলোড করুন
                  </button>
                </div>
              </div>

              {/* Option B: Direct Link */}
              <div className="bg-[#05131b] border border-cyan-950 p-4 rounded-xl flex flex-col justify-between space-y-3 text-left">
                <div>
                  <h4 className="text-xs font-extrabold text-[#00e3cd] uppercase tracking-wider">অপশন ২: সরাসরি অনলাইন লিংক (Direct Image URL)</h4>
                  <p className="text-[10px] text-slate-300 mt-1 font-sans font-medium">যেকোনো ইমেজ হোস্টিং বা অনলাইন ফটো লিংক কপি করে বক্সে সরাসরি পেস্ট করুন।</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="bundleUrlInput"
                    placeholder="https://example.com/item.png"
                    defaultValue={bundleOfferImg.startsWith('data:') ? '' : bundleOfferImg}
                    className="flex-1 px-3 py-1.8 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-[10px] font-mono focus:outline-none focus:border-cyan-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBundleUrlSubmit((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('bundleUrlInput') as HTMLInputElement;
                      if (input) handleBundleUrlSubmit(input.value);
                    }}
                    className="px-4 py-1.8 bg-cyan-600 hover:bg-cyan-700 text-slate-950 font-black text-xs rounded-lg cursor-pointer transition shrink-0"
                    disabled={userRole === 'ReadOnly'}
                  >
                    সেভ করুন
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 font-sans">
              💡 আপনি এখান থেকে আজকের অফারের যে রেইনকোট বান্ডেল বা লগো ছবি সেভ করবেন, সেটি পুরো ল্যান্ডিং পেজের “আজকের অফারে যা পাচ্ছেন” বিশেষ অফার ব্লকে রিয়েল-টাইমে শো করবে।
            </p>
          </div>
        </div>
      </div>

      {/* 🎥 "রেইনকোটটির কার্যকারিতা লাইভ ভিডিও" URL Manager Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 text-left">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-black text-amber-400 text-sm sm:text-base flex items-center gap-1.5">
            <span>🎥</span> রেইনকোটটির কার্যকারিতা লাইভ ভিডিও টেস্টসমূহ
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-300 mt-1 font-sans">
            ল্যান্ডিং পেজের "লাইভ ভিডিও ভিডিওতে দেখুন" সেকশনে প্রদর্শিত ভিডিওগুলোর টাইটেল এবং ফেসবুক/ইউটিউব লিংক এখান থেকে সহজে পরিবর্তন বা নতুন ভিডিও যোগ করতে পারবেন।
          </p>
        </div>

        {videoError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            {videoError}
          </div>
        )}

        {videoSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            {videoSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Form to Add / Edit Video URL */}
          <form onSubmit={handleSaveVideo} className="md:col-span-5 bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-extrabold text-[#00e3cd] uppercase tracking-wider">
              {editingVideoId ? '📝 ভিডিও লিংক এডিট করুন' : '➕ নতুন ভিডিও লিংক যোগ করুন'}
            </h4>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-bold">ভিডিওর সংক্ষিপ্ত টাইটেল</label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="যেমন: রেইনপ্রুফ লাইভ টেস্ট"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-bold">টার্গেট ল্যান্ডিং পেজ (Target Page)</label>
              <select
                value={videoPage}
                onChange={(e) => setVideoPage(e.target.value as 'raincoat' | 'bikecover')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-slate-100 text-xs font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="raincoat">🌧️ রেইনকোট ল্যান্ডিং পেজ (Raincoat Page)</option>
                <option value="bikecover">🏍️ বাইক কভার ল্যান্ডিং পেজ (Bike Cover Page)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-bold">ভিডিও লিংক (Facebook / YouTube URL) *</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.facebook.com/reel/... "
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[9px] text-slate-500 block">ফেসবুক রিলে বা ভিডিও লিংক অথবা ইউটিউব ভিডিওর পুর্নাঙ্গ লিংক পেস্ট করুন।</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSavingVideo || userRole === 'ReadOnly'}
                className="flex-1 py-1.8 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {isSavingVideo ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : editingVideoId ? (
                  'আপডেট করুন'
                ) : (
                  'নতুন ভিডিও যুক্ত করুন'
                )}
              </button>
              {editingVideoId && (
                <button
                  type="button"
                  onClick={handleCancelVideoEdit}
                  className="px-3 py-1.8 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
              )}
            </div>
          </form>

          {/* List of currently managed Videos */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="text-xs font-extrabold text-[#00e3cd] uppercase tracking-wider">রিসেন্ট ভিডিও তালিকা ({liveVideos.length})</h4>
            {liveVideos.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                কোনো কাস্টম ভিডিও লিংক খুজে পাওয়া যায়নি। ডিফল্ট ভিডিওস চালু থাকবে।
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {liveVideos.map((video, idx) => (
                  <div key={video.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <h5 className="font-extrabold text-xs text-amber-300 truncate">{video.title || `ভিডিও #${idx+1}`}</h5>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                          video.page === 'bikecover' 
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {video.page === 'bikecover' ? '🏍️ বাইক কভার' : '🌧️ রেইনকোট'}
                        </span>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-450 rounded px-1 shrink-0">ধাপ {idx + 1}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1.5 truncate select-all">{video.url}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditVideo(video)}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded transition cursor-pointer"
                        title="এডিট করুন"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-1 text-slate-400 hover:text-rose-450 hover:text-rose-450 text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                        title="মুছে ফেলুন"
                        disabled={userRole === 'ReadOnly'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Interactive form including drag and drop area */}
        <div className="w-full lg:w-2/5 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Image className="h-4 w-4 text-indigo-600" />
              {editingId ? 'স্লাইড এডিট করুন' : 'নতুন ইমেজ যোগ করুন'}
            </h3>
            {editingId && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                এডিট মোড
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSaveMediaItem} className="space-y-3.5 text-left">
            
            {/* DRAG AND DROP ZONE */}
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">
                ১. নতুন ইমেজ ফাইল ড্রপ বা সিলেক্ট করুন (Drag & Drop Image)
              </label>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] relative ${
                  isDragging 
                    ? 'border-indigo-600 bg-indigo-50/60' 
                    : imageUrl 
                      ? 'border-emerald-300 bg-slate-50 hover:bg-slate-100/50' 
                      : 'border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileInputChange}
                />

                {imageUrl ? (
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border shadow-sm relative shrink-0 bg-white">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      ✓ ইমেজ সিলেক্ট করা হয়েছে! পরিবর্তন করতে আবার ড্র্যাগ করুন।
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-extrabold text-indigo-600">এখানে ফাইল ড্র্যাগ করুন</span> অথবা <span className="underline font-bold text-slate-700">ক্লিবোর্ন থেকে ব্রাউজ করুন</span>
                    </div>
                    <p className="text-[9px] text-slate-400">JPG, PNG বা WEBP (অনধিক ১.৫ মেগাবাইট)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Direct URL input fields to override file upload optionally */}
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                অথবা সরাসরি ইমেজ লিংক (Direct URL Address)
              </label>
              <input 
                type="text"
                placeholder="https://images.unsplash.com/... বা base64..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs bg-white font-mono"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {/* Banner Background Image Section */}
            <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2 text-left">
              <label className="block text-[10px] text-slate-600 font-extrabold uppercase">
                ২. ব্যানার ব্যাকগ্রাউন্ড ছবি (Optional Banner Background Image)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={bgFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleBgFileInputChange}
                />
                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-250 hover:bg-slate-300 border text-slate-700 text-[10px] font-black rounded-lg cursor-pointer transition shrink-0 flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" /> আপলোড
                </button>
                <input 
                  type="text"
                  placeholder="সরাসরি ব্যাকগ্রাউন্ড ইমেজের লিংক..."
                  className="flex-1 px-2.5 py-1.5 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-[10px] bg-white font-mono"
                  value={bgUrl}
                  onChange={(e) => setBgUrl(e.target.value)}
                />
              </div>
              {bgUrl && (
                <div className="flex items-center gap-2 mt-1.5 p-1.5 bg-white border border-slate-150 rounded-lg">
                  <div className="w-8 h-8 rounded border overflow-hidden shrink-0">
                    <img src={bgUrl} alt="Background Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[9px] text-slate-500 truncate leading-none mb-0.5">ব্যাকগ্রাউন্ড ছবি সিলেক্টেড</p>
                    <p className="text-[8px] text-slate-400 font-mono truncate leading-none">{bgUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBgUrl('')}
                    className="p-1 text-rose-500 hover:text-rose-700 font-bold text-[9px] cursor-pointer"
                  >
                    মুছুন
                  </button>
                </div>
              )}
            </div>

            {/* Target Landing Page field to separate sliders */}
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                টার্গেট ল্যান্ডিং পেজ (Target Landing Page)
              </label>
              <select
                className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-bold bg-white"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value as 'raincoat' | 'bikecover')}
              >
                <option value="raincoat">🌧️ রেইনকোট ল্যান্ডিং পেজ (Raincoat Page)</option>
                <option value="bikecover">🏍️ বাইক কভার ল্যান্ডিং পেজ (Bike Cover Page)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">স্লাইড টাইটেল (Slide Title)</label>
                <input 
                  type="text"
                  placeholder="যেমন: ১% লিকপ্রুফ সীমিং প্রযুক্তি"
                  className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-bold bg-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">স্টিকার ব্যাজ/ট্যাগ (Badge Label)</label>
                <input 
                  type="text"
                  placeholder="যেমন: ১০০% ওয়াটারপ্রুফ"
                  className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-semibold bg-white"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">ক্রমিক পজিশন নম্বর (Order Index)</label>
                <input 
                  type="number"
                  className="w-full px-3 py-1.8 border rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-mono bg-white"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  required
                />
              </div>
              <div className="flex items-end justify-end pb-1.5 text-slate-400 text-[10px] font-medium leading-tight">
                * স্লাইডসমূহ এই তালিকা অনুযায়ী সাজানো হবে।
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">সংক্ষিপ্ত বিবরণ (Description Text)</label>
              <textarea 
                rows={2}
                placeholder="রেইনকোট স্লাইডের বিশেষ টেকনিক্যাল বিবরণ লিখুন..."
                className="w-full px-3 py-1.8 border rounded-lg focus:outline-none text-slate-800 text-xs bg-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-1"
              >
                {editingId ? 'আপডেট নিশ্চিত করুন' : 'গ্যালারিতে যুক্ত করুন'}
              </button>
              
              {(editingId || imageUrl || title) && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="py-2 px-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>
          </form>

          <div className="pt-4 border-t border-slate-200 text-left space-y-2">
            {showResetConfirm ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-fade-in text-left">
                <p className="text-[10px] text-amber-950 font-extrabold leading-normal font-sans">
                  ⚠️ আপনি কি নিশ্চিতভাবে সব কাস্টম এডিট রিসেট দিয়ে প্রোডাক্টের মূল ৫টি প্রি-সেট ইমেজ ফিরিয়ে আনতে ও ডাটাবেসে সিঙ্ক করতে চান?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowResetConfirm(false);
                      await handleResetToDefaults();
                    }}
                    className="px-3 py-1.2 bg-rose-650 hover:bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer"
                  >
                    হ্যাঁ, নিশ্চিত রিস্টোর করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-[10px] cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (userRole === 'ReadOnly') {
                    setErrorMsg('রিড-অনলি এক্সেস দিয়ে এটি সম্ভব নয়।');
                    return;
                  }
                  setShowResetConfirm(true);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                ♻️ ফ্যাক্টরি ডিফল্ট ইমেজগুলো রিস্টোর করুন
              </button>
            )}
            <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed font-sans">
              * রিস্টোর বাটনে চাপ দিলে আপনার আপলোড করা ছবিগুলো মুছে মূল ৫টি প্রি-সেট রেইনকোট ছবি ড্যাশবোর্ডে ফিরে আসবে।
            </p>
          </div>
        </div>

        {/* Right list showing uploaded items and current order index */}
        <div className="flex-1 bg-white border border-slate-200 p-5 rounded-2xl">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
              🖼️ লাইভ প্রোডাক্ট স্লাইডশো ইমেজসমূহ ({mediaItems.length})
            </h3>
            <button 
              onClick={loadMedia}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 flex items-center gap-1 cursor-pointer font-bold"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> রিফ্রেশ
            </button>
          </div>

          {/* Landing Page Filter Tabs */}
          <div className="flex border border-slate-200/60 mb-4 bg-slate-50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterTab === 'all' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 সকল পেইজ ({mediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('raincoat')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterTab === 'raincoat' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌧️ রেইনকোট ({mediaItems.filter(item => !item.page || item.page === 'raincoat').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('bikecover')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterTab === 'bikecover' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏍️ বাইক কভার ({mediaItems.filter(item => item.page === 'bikecover').length})
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <p className="text-xs">Firestore ডেটাবেস থেকে ফটো গ্যালারি ড্র করছি...</p>
            </div>
          ) : mediaItems.filter(item => {
            if (filterTab === 'all') return true;
            if (filterTab === 'bikecover') return item.page === 'bikecover';
            return !item.page || item.page === 'raincoat';
          }).length === 0 ? (
            <div className="text-center py-24 text-slate-450 italic text-xs">এই ক্যাটাগরিতে কোনো পিকচার যুক্ত নেই!</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {mediaItems.filter(item => {
                if (filterTab === 'all') return true;
                if (filterTab === 'bikecover') return item.page === 'bikecover';
                return !item.page || item.page === 'raincoat';
              }).map((item, index) => (
                <div 
                  key={item.id} 
                  className={`border p-3.5 rounded-xl bg-slate-50/50 flex gap-4 text-xs items-center justify-between transition ${
                    editingId === item.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-150 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    {/* Tiny thumbnail */}
                    <div className="w-14 h-14 bg-white rounded-lg overflow-hidden shrink-0 border relative">
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1 left-1 w-4 h-4 bg-slate-900/80 text-white rounded-full text-[8px] font-mono flex items-center justify-center border font-bold">
                        {item.orderIndex}
                      </span>
                    </div>

                    <div className="space-y-1 text-left overflow-hidden">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                          item.page === 'bikecover' 
                            ? 'bg-orange-50 border-orange-150 text-orange-700' 
                            : 'bg-indigo-50 border-indigo-150 text-indigo-700'
                        }`}>
                          {item.page === 'bikecover' ? '🏍️ বাইক কভার' : '🌧️ রেইনকোট'}
                        </span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full">
                          {item.tag}
                        </span>
                        {item.bgUrl && (
                          <span className="bg-emerald-150 border-emerald-200 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full">
                            🌌 ব্যাকগ্রাউন্ড যুক্ত
                          </span>
                        )}
                        <h4 className="font-extrabold text-slate-900 truncate" title={item.title}>
                          {item.title}
                        </h4>
                      </div>
                      
                      {item.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="text-[9px] text-slate-400 font-mono">
                        ID: {item.id}
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2shrink-0">
                    
                    {/* Multi-ordering index actions handles */}
                    <div className="flex flex-col gap-0.5 mr-2">
                      <button
                        type="button"
                        onClick={() => moveOrder(index, 'up')}
                        disabled={index === 0 || userRole === 'ReadOnly'}
                        className={`p-1 rounded hover:bg-slate-200 transition ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer text-slate-500'}`}
                        title="উপরে নিন"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrder(index, 'down')}
                        disabled={index === mediaItems.length - 1 || userRole === 'ReadOnly'}
                        className={`p-1 rounded hover:bg-slate-200 transition ${index === mediaItems.length - 1 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer text-slate-500'}`}
                        title="নীচে নিন"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2 items-center">
                      <button 
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 p-1.5 rounded transition cursor-pointer"
                        title="সম্পাদনা (Edit)"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 border border-rose-200 rounded-lg animate-fade-in shadow-xs shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              await handleDeleteItem(item.id);
                              setDeleteConfirmId(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] px-2 py-0.8 rounded cursor-pointer shrink-0"
                          >
                            হ্যাঁ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] px-1.5 py-0.8 rounded cursor-pointer shrink-0"
                          >
                            না
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            if (userRole === 'ReadOnly') {
                              setErrorMsg('দুঃখিত! রিড-অনলি এক্সেস দিয়ে স্লাইড ডিলিট করা সম্ভব নয়।');
                              return;
                            }
                            setDeleteConfirmId(item.id);
                          }}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 p-1.5 rounded transition cursor-pointer"
                          title="অপসারণ (Delete)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
