"use client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/custom/Navbar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { DateTimePicker } from "@/components/ui/custom/DateTimePicker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Connection, TransactionType, SplitMethod, Category, Source, SourceType, Transaction } from "@/types/transaction";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Search, Filter, X, Calendar, ArrowUpDown, TrendingUp, TrendingDown, ArrowRightLeft, RefreshCw, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("dashboard-active-tab");
            if (saved && ["analytics", "transactions", "categories", "connections", "sources"].includes(saved)) {
                return saved;
            }
        }
        return "transactions";
    });
    const [transactionDialogOpen, setTransactionDialogOpen] = useState<boolean>(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState<boolean>(false);
    const [sourceDialogOpen, setSourceDialogOpen] = useState<boolean>(false);

    const [categories, setCategories] = useState<Array<Category>>([]);
    const [availableConnections, setAvailableConnections] = useState<Array<Connection>>([]);
    const [sources, setSources] = useState<Array<Source>>([]);

    const [newCategoryTitle, setNewCategoryTitle] = useState<string>("");
    const [newCategoryEmoji, setNewCategoryEmoji] = useState<string>("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newConnectionName, setNewConnectionName] = useState<string>("");
    const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
    const [newSourceName, setNewSourceName] = useState<string>("");
    const [newSourceType, setNewSourceType] = useState<SourceType>("BANK");
    const [newSourceAmount, setNewSourceAmount] = useState<number>(0);
    const [newSourceCreditLimit, setNewSourceCreditLimit] = useState<number>(0);
    const [newSourceSharedLimit, setNewSourceSharedLimit] = useState<boolean>(false);
    const [newSourceCardNames, setNewSourceCardNames] = useState<string[]>([]);
    const [newCardNameInput, setNewCardNameInput] = useState<string>("");
    const [editingSource, setEditingSource] = useState<Source | null>(null);

    const [transactionAmount, setTransactionAmount] = useState<number | null>(null);
    const [transactionDate, setTransactionDate] = useState<Date>(new Date());
    const [transactionDescription, setTransactionDescription] = useState<string>("");
    const [transactionType, setTransactionType] = useState<TransactionType>("EXPENSE");
    const [transactionTitle, setTransactionTitle] = useState<string>("");
    const [transactionCategory, setTransactionCategory] = useState<string>("");
    const [transactionSource, setTransactionSource] = useState<string>("");
    const [transactionDestination, setTransactionDestination] = useState<string>("");
    const [transactionSelectedCardName, setTransactionSelectedCardName] = useState<string>("");
    const [transactionSelectedDestinationCardName, setTransactionSelectedDestinationCardName] = useState<string>("");
    const [transactionSplitted, setTransactionSplitted] = useState<boolean>(false);
    const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const [savingState, setSavingState] = useState<string | null>(null);

    const tabs = [
        {
            label: "Analytics",
            value: "analytics"
        },
        {
            label: "Transactions",
            value: "transactions"
        },
        {
            label: "Sources",
            value: "sources"
        },
        {
            label: "Categories",
            value: "categories"
        },
        {
            label: "Connections",
            value: "connections"
        },
    ]

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [cursor, setCursor] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [showFilters, setShowFilters] = useState<boolean>(false);

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<TransactionType[]>([]);
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
    const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [hasLoadedTransactions, setHasLoadedTransactions] = useState<boolean>(false);

    const [categoriesData, setCategoriesData] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
    const [hasMoreCategories, setHasMoreCategories] = useState<boolean>(true);
    const [categoriesCursor, setCategoriesCursor] = useState<string | null>(null);
    const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");
    const [debouncedCategorySearch, setDebouncedCategorySearch] = useState<string>("");
    const [hasLoadedCategories, setHasLoadedCategories] = useState<boolean>(false);
    const [isRefreshingCategories, setIsRefreshingCategories] = useState<boolean>(false);

    const [connectionsData, setConnectionsData] = useState<Connection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState<boolean>(false);
    const [hasMoreConnections, setHasMoreConnections] = useState<boolean>(true);
    const [connectionsCursor, setConnectionsCursor] = useState<string | null>(null);
    const [connectionSearchQuery, setConnectionSearchQuery] = useState<string>("");
    const [debouncedConnectionSearch, setDebouncedConnectionSearch] = useState<string>("");
    const [hasLoadedConnections, setHasLoadedConnections] = useState<boolean>(false);
    const [isRefreshingConnections, setIsRefreshingConnections] = useState<boolean>(false);

    const [sourcesData, setSourcesData] = useState<Source[]>([]);
    const [loadingSources, setLoadingSources] = useState<boolean>(false);
    const [hasMoreSources, setHasMoreSources] = useState<boolean>(true);
    const [sourcesCursor, setSourcesCursor] = useState<string | null>(null);
    const [sourceSearchQuery, setSourceSearchQuery] = useState<string>("");
    const [debouncedSourceSearch, setDebouncedSourceSearch] = useState<string>("");
    const [hasLoadedSources, setHasLoadedSources] = useState<boolean>(false);
    const [isRefreshingSources, setIsRefreshingSources] = useState<boolean>(false);

    const [analyticsTimeRange, setAnalyticsTimeRange] = useState<string>("1month");
    const [analyticsData, setAnalyticsData] = useState<{
        totals: { income: number; expenses: number; transfers: number; balance: number; incomeCount: number; expenseCount: number; transferCount: number };
        categoryBreakdown: Array<{ id: string; name: string; emoji: string; amount: number; count: number }>;
        sourceBreakdown: Array<{ id: string; name: string; type: string; amount: number; count: number }>;
        timeSeriesData: Array<{ date: string; income: number; expenses: number; net: number }>;
        topTransactions: Array<{ id: string; title: string; amount: number; date: Date; type: string; category: { emoji: string; title: string } }>;
    } | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

    const [isMobile, setIsMobile] = useState<boolean>(false);

    const observerTarget = useRef<HTMLDivElement>(null);
    const categoriesObserverTarget = useRef<HTMLDivElement>(null);
    const connectionsObserverTarget = useRef<HTMLDivElement>(null);
    const sourcesObserverTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCategories();
        loadConnections();
        loadSources();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCategorySearch(categorySearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [categorySearchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedConnectionSearch(connectionSearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [connectionSearchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSourceSearch(sourceSearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [sourceSearchQuery]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("dashboard-active-tab", activeTab);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "transactions" && !hasLoadedTransactions) {
            resetAndLoadTransactions();
            setHasLoadedTransactions(true);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "transactions" && hasLoadedTransactions) {
            resetAndLoadTransactions();
        }
    }, [debouncedSearch, selectedCategories, selectedConnections, selectedSources, selectedTypes, dateFilter, customDateFrom, customDateTo]);

    useEffect(() => {
        if (activeTab === "categories" && !hasLoadedCategories) {
            resetAndLoadCategoriesData();
            setHasLoadedCategories(true);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "categories" && hasLoadedCategories) {
            resetAndLoadCategoriesData();
        }
    }, [debouncedCategorySearch]);

    useEffect(() => {
        if (activeTab === "connections" && !hasLoadedConnections) {
            resetAndLoadConnectionsData();
            setHasLoadedConnections(true);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "connections" && hasLoadedConnections) {
            resetAndLoadConnectionsData();
        }
    }, [debouncedConnectionSearch]);

    useEffect(() => {
        if (activeTab === "sources" && !hasLoadedSources) {
            resetAndLoadSourcesData();
            setHasLoadedSources(true);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "sources" && hasLoadedSources) {
            resetAndLoadSourcesData();
        }
    }, [debouncedSourceSearch]);

    useEffect(() => {
        if (activeTab === "analytics") {
            loadAnalyticsData();
        }
    }, [activeTab, analyticsTimeRange]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingTransactions && activeTab === "transactions") {
                    loadMoreTransactions();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loadingTransactions, cursor, activeTab]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreCategories && !loadingCategories && activeTab === "categories") {
                    loadMoreCategoriesData();
                }
            },
            { threshold: 0.1 }
        );

        if (categoriesObserverTarget.current) {
            observer.observe(categoriesObserverTarget.current);
        }

        return () => {
            if (categoriesObserverTarget.current) {
                observer.unobserve(categoriesObserverTarget.current);
            }
        };
    }, [hasMoreCategories, loadingCategories, categoriesCursor, activeTab]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreConnections && !loadingConnections && activeTab === "connections") {
                    loadMoreConnectionsData();
                }
            },
            { threshold: 0.1 }
        );

        if (connectionsObserverTarget.current) {
            observer.observe(connectionsObserverTarget.current);
        }

        return () => {
            if (connectionsObserverTarget.current) {
                observer.unobserve(connectionsObserverTarget.current);
            }
        };
    }, [hasMoreConnections, loadingConnections, connectionsCursor, activeTab]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreSources && !loadingSources && activeTab === "sources") {
                    loadMoreSourcesData();
                }
            },
            { threshold: 0.1 }
        );

        if (sourcesObserverTarget.current) {
            observer.observe(sourcesObserverTarget.current);
        }

        return () => {
            if (sourcesObserverTarget.current) {
                observer.unobserve(sourcesObserverTarget.current);
            }
        };
    }, [hasMoreSources, loadingSources, sourcesCursor, activeTab]);

    const loadCategories = async () => {
        try {
            const response = await axios.get('/api/category');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const loadConnections = async () => {
        try {
            const response = await axios.get('/api/connection');
            const connections = response.data.connections.map((conn: Connection) => ({
                ...conn,
                selected: false,
                amount: 0,
                percentage: 0,
                isSelf: false
            }));
            const user = response.data.user;
            const myselfConnection: Connection = {
                id: user.id,
                name: user.name || "Myself",
                userId: user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                selected: false,
                amount: 0,
                percentage: 0,
                isSelf: true
            };
            setAvailableConnections([myselfConnection, ...connections]);
        } catch (error) {
            console.error('Error loading connections:', error);
            toast.error('Failed to load connections');
        }
    };

    const loadSources = async () => {
        try {
            const response = await axios.get('/api/source');
            const loadedSources = response.data.sources.map((source: Source) => {
                if (source.cardNames && typeof source.cardNames === 'string') {
                    try {
                        source.cardNames = JSON.parse(source.cardNames);
                    } catch {
                        source.cardNames = [];
                    }
                }
                return source;
            });
            setSources(loadedSources);
        } catch (error) {
            console.error('Error loading sources:', error);
            toast.error('Failed to load sources');
        }
    };

    const buildQueryParams = (cursorOverride?: string | null) => {
        const params = new URLSearchParams();

        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedCategories.length > 0) params.append('categoryIds', selectedCategories.join(','));
        if (selectedConnections.length > 0) params.append('connectionIds', selectedConnections.join(','));
        if (selectedSources.length > 0) params.append('sourceIds', selectedSources.join(','));
        if (selectedTypes.length > 0) params.append('types', selectedTypes.join(','));

        const dateRange = getDateRange();
        if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
        if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());

        params.append('limit', '20');
        const cursorToUse = cursorOverride !== undefined ? cursorOverride : cursor;
        if (cursorToUse) params.append('cursor', cursorToUse);

        return params.toString();
    };

    const getDateRange = () => {
        const now = new Date();

        switch (dateFilter) {
            case '1day':
                return {
                    from: startOfDay(subDays(now, 1)),
                    to: endOfDay(now)
                };
            case '1week':
                return {
                    from: startOfDay(subDays(now, 7)),
                    to: endOfDay(now)
                };
            case '1month':
                return {
                    from: startOfDay(subMonths(now, 1)),
                    to: endOfDay(now)
                };
            case 'custom':
                return {
                    from: customDateFrom ? startOfDay(customDateFrom) : undefined,
                    to: customDateTo ? endOfDay(customDateTo) : undefined
                };
            default:
                return { from: undefined, to: undefined };
        }
    };

    const resetAndLoadTransactions = async () => {
        setTransactions([]);
        setCursor(null);
        setHasMore(true);
        await loadTransactions(null);
    };

    const loadTransactions = async (currentCursor: string | null) => {
        if (loadingTransactions) return;

        try {
            setLoadingTransactions(true);
            const queryParams = buildQueryParams(currentCursor);
            const response = await axios.get(`/api/transaction?${queryParams}`);

            const newTransactions = response.data.transactions;
            const nextCursor = response.data.nextCursor;

            if (currentCursor) {
                setTransactions(prev => [...prev, ...newTransactions]);
            } else {
                setTransactions(newTransactions);
            }

            setCursor(nextCursor || null);
            setHasMore(!!nextCursor);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoadingTransactions(false);
        }
    };

    const loadMoreTransactions = () => {
        if (cursor && !loadingTransactions) {
            loadTransactions(cursor);
        }
    };

    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedCategories([]);
        setSelectedConnections([]);
        setSelectedSources([]);
        setSelectedTypes([]);
        setDateFilter("all");
        setCustomDateFrom(undefined);
        setCustomDateTo(undefined);
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (debouncedSearch) count++;
        if (selectedCategories.length > 0) count++;
        if (selectedConnections.length > 0) count++;
        if (selectedSources.length > 0) count++;
        if (selectedTypes.length > 0) count++;
        if (dateFilter !== "all") count++;
        return count;
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const toggleConnection = (connectionId: string) => {
        setSelectedConnections(prev =>
            prev.includes(connectionId)
                ? prev.filter(id => id !== connectionId)
                : [...prev, connectionId]
        );
    };

    const toggleSource = (sourceId: string) => {
        setSelectedSources(prev =>
            prev.includes(sourceId)
                ? prev.filter(id => id !== sourceId)
                : [...prev, sourceId]
        );
    };

    const toggleType = (type: TransactionType) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await resetAndLoadTransactions();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 500);
    };

    const buildCategoryQueryParams = (cursorOverride?: string | null) => {
        const params = new URLSearchParams();

        if (debouncedCategorySearch) params.append('search', debouncedCategorySearch);
        params.append('limit', '20');

        const cursorToUse = cursorOverride !== undefined ? cursorOverride : categoriesCursor;
        if (cursorToUse) params.append('cursor', cursorToUse);

        return params.toString();
    };

    const resetAndLoadCategoriesData = async () => {
        setCategoriesData([]);
        setCategoriesCursor(null);
        setHasMoreCategories(true);
        await loadCategoriesData(null);
    };

    const loadCategoriesData = async (currentCursor: string | null) => {
        if (loadingCategories) return;

        try {
            setLoadingCategories(true);
            const queryParams = buildCategoryQueryParams(currentCursor);
            const response = await axios.get(`/api/category?${queryParams}`);

            const newCategories = response.data.categories;
            const nextCursor = response.data.nextCursor;

            if (currentCursor) {
                setCategoriesData(prev => [...prev, ...newCategories]);
            } else {
                setCategoriesData(newCategories);
            }

            setCategoriesCursor(nextCursor || null);
            setHasMoreCategories(!!nextCursor);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadMoreCategoriesData = () => {
        if (categoriesCursor && !loadingCategories) {
            loadCategoriesData(categoriesCursor);
        }
    };

    const handleRefreshCategories = async () => {
        setIsRefreshingCategories(true);
        await resetAndLoadCategoriesData();
        setTimeout(() => {
            setIsRefreshingCategories(false);
        }, 500);
    };

    const openEditCategory = (category: Category) => {
        setEditingCategory(category);
        setNewCategoryTitle(category.title);
        setNewCategoryEmoji(category.emoji);
        setCategoryDialogOpen(true);
    };

    const closeEditCategory = () => {
        setEditingCategory(null);
        setNewCategoryTitle("");
        setNewCategoryEmoji("");
        setCategoryDialogOpen(false);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`/api/category?id=${categoryId}`);
            setCategoriesData(categoriesData.filter(cat => cat.id !== categoryId));
            await loadCategories();
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    const buildConnectionQueryParams = (cursorOverride?: string | null) => {
        const params = new URLSearchParams();

        if (debouncedConnectionSearch) params.append('search', debouncedConnectionSearch);
        params.append('limit', '20');

        const cursorToUse = cursorOverride !== undefined ? cursorOverride : connectionsCursor;
        if (cursorToUse) params.append('cursor', cursorToUse);

        return params.toString();
    };

    const resetAndLoadConnectionsData = async () => {
        setConnectionsData([]);
        setConnectionsCursor(null);
        setHasMoreConnections(true);
        await loadConnectionsData(null);
    };

    const loadConnectionsData = async (currentCursor: string | null) => {
        if (loadingConnections) return;

        try {
            setLoadingConnections(true);
            const queryParams = buildConnectionQueryParams(currentCursor);
            const response = await axios.get(`/api/connection?${queryParams}`);

            const newConnections = response.data.connections;
            const nextCursor = response.data.nextCursor;

            if (currentCursor) {
                setConnectionsData(prev => [...prev, ...newConnections]);
            } else {
                setConnectionsData(newConnections);
            }

            setConnectionsCursor(nextCursor || null);
            setHasMoreConnections(!!nextCursor);
        } catch (error) {
            console.error('Error loading connections:', error);
            toast.error('Failed to load connections');
        } finally {
            setLoadingConnections(false);
        }
    };

    const loadMoreConnectionsData = () => {
        if (connectionsCursor && !loadingConnections) {
            loadConnectionsData(connectionsCursor);
        }
    };

    const handleRefreshConnections = async () => {
        setIsRefreshingConnections(true);
        await resetAndLoadConnectionsData();
        setTimeout(() => {
            setIsRefreshingConnections(false);
        }, 500);
    };

    const openEditConnection = (connection: Connection) => {
        setEditingConnection(connection);
        setNewConnectionName(connection.name);
        setConnectionDialogOpen(true);
    };

    const closeEditConnection = () => {
        setEditingConnection(null);
        setNewConnectionName("");
        setConnectionDialogOpen(false);
    };

    const handleDeleteConnection = async (connectionId: string) => {
        if (!confirm('Are you sure you want to delete this connection? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`/api/connection?id=${connectionId}`);
            setConnectionsData(connectionsData.filter(conn => conn.id !== connectionId));
            await loadConnections();
            toast.success('Connection deleted successfully');
        } catch (error) {
            console.error('Error deleting connection:', error);
            toast.error('Failed to delete connection');
        }
    };

    const buildSourceQueryParams = (cursorOverride?: string | null) => {
        const params = new URLSearchParams();

        if (debouncedSourceSearch) params.append('search', debouncedSourceSearch);
        params.append('limit', '20');

        const cursorToUse = cursorOverride !== undefined ? cursorOverride : sourcesCursor;
        if (cursorToUse) params.append('cursor', cursorToUse);

        return params.toString();
    };

    const resetAndLoadSourcesData = async () => {
        setSourcesData([]);
        setSourcesCursor(null);
        setHasMoreSources(true);
        await loadSourcesData(null);
    };

    const loadSourcesData = async (currentCursor: string | null) => {
        if (loadingSources) return;

        try {
            setLoadingSources(true);
            const queryParams = buildSourceQueryParams(currentCursor);
            const response = await axios.get(`/api/source?${queryParams}`);

            const newSources = response.data.sources;
            const nextCursor = response.data.nextCursor;

            if (currentCursor) {
                setSourcesData(prev => [...prev, ...newSources]);
            } else {
                setSourcesData(newSources);
            }

            setSourcesCursor(nextCursor || null);
            setHasMoreSources(!!nextCursor);
        } catch (error) {
            console.error('Error loading sources:', error);
            toast.error('Failed to load sources');
        } finally {
            setLoadingSources(false);
        }
    };

    const loadMoreSourcesData = () => {
        if (sourcesCursor && !loadingSources) {
            loadSourcesData(sourcesCursor);
        }
    };

    const handleRefreshSources = async () => {
        setIsRefreshingSources(true);
        await resetAndLoadSourcesData();
        setTimeout(() => {
            setIsRefreshingSources(false);
        }, 500);
    };

    const openEditSource = (source: Source) => {
        setEditingSource(source);
        setNewSourceName(source.name);
        setNewSourceType(source.type);
        setNewSourceAmount(source.amount);
        setNewSourceCreditLimit(source.creditLimit || 0);
        setNewSourceSharedLimit(Boolean(source.sharedLimit));
        let cardNames = [];
        if (Array.isArray(source.cardNames)) {
            cardNames = source.cardNames;
        } else if (source.cardNames && typeof source.cardNames === 'string') {
            try {
                cardNames = JSON.parse(source.cardNames);
            } catch {
                cardNames = [];
            }
        }
        setNewSourceCardNames(cardNames);
        setSourceDialogOpen(true);
    };

    const closeEditSource = () => {
        setEditingSource(null);
        setNewSourceName("");
        setNewSourceType("BANK");
        setNewSourceAmount(0);
        setNewSourceCreditLimit(0);
        setNewSourceSharedLimit(false);
        setNewSourceCardNames([]);
        setNewCardNameInput("");
        setSourceDialogOpen(false);
    };

    const handleDeleteSource = async (sourceId: string) => {
        if (!confirm('Are you sure you want to delete this source? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`/api/source?id=${sourceId}`);
            setSourcesData(sourcesData.filter(src => src.id !== sourceId));
            await loadSources();
            toast.success('Source deleted successfully');
        } catch (error) {
            console.error('Error deleting source:', error);
            toast.error('Failed to delete source');
        }
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!confirm('Are you sure you want to move this transaction to trash? You can restore it later.')) {
            return;
        }

        try {
            await axios.delete(`/api/transaction?id=${transactionId}`);
            setTransactions(transactions.filter((t: Transaction) => t.id !== transactionId));
            await loadSources();
            if (activeTab === "analytics") {
                await loadAnalyticsData();
            }
            toast.success('Transaction moved to trash');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Failed to delete transaction');
        }
    };

    const loadAnalyticsData = async () => {
        setLoadingAnalytics(true);
        try {
            const response = await axios.get(`/api/analytics?timeRange=${analyticsTimeRange}`);
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const createCategory = async () => {
        if (!newCategoryTitle || !newCategoryEmoji) {
            toast.error('Please fill all fields');
            return;
        }

        const actionType = editingCategory ? 'update-category' : 'add-category';
        setSavingState(actionType);

        try {
            if (editingCategory) {
                const response = await axios.patch('/api/category', {
                    id: editingCategory.id,
                    title: newCategoryTitle,
                    emoji: newCategoryEmoji
                });
                setCategories(categories.map(cat =>
                    cat.id === editingCategory.id ? response.data.category : cat
                ));
                setCategoriesData(categoriesData.map(cat =>
                    cat.id === editingCategory.id ? response.data.category : cat
                ));
                toast.success(response.data.message);
            } else {
                const response = await axios.post('/api/category', {
                    title: newCategoryTitle,
                    emoji: newCategoryEmoji
                });
                setCategories([response.data.category, ...categories]);
                if (activeTab === "categories") {
                    resetAndLoadCategoriesData();
                }
                toast.success(response.data.message);
            }

            setNewCategoryTitle("");
            setNewCategoryEmoji("");
            setEditingCategory(null);
            setCategoryDialogOpen(false);
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        } finally {
            setSavingState(null);
        }
    };

    const createConnection = async () => {
        if (!newConnectionName) {
            toast.error('Please enter a name');
            return;
        }

        const actionType = editingConnection ? 'update-connection' : 'add-connection';
        setSavingState(actionType);

        try {
            if (editingConnection) {
                const response = await axios.patch('/api/connection', {
                    id: editingConnection.id,
                    name: newConnectionName
                });
                setAvailableConnections(availableConnections.map(conn =>
                    conn.id === editingConnection.id ? { ...response.data.connection, selected: conn.selected, amount: conn.amount, percentage: conn.percentage } : conn
                ));
                setConnectionsData(connectionsData.map(conn =>
                    conn.id === editingConnection.id ? response.data.connection : conn
                ));
                toast.success(response.data.message);
            } else {
                const response = await axios.post('/api/connection', {
                    name: newConnectionName
                });
                const newConnection = {
                    ...response.data.connection,
                    selected: false,
                    amount: 0,
                    percentage: 0
                };
                setAvailableConnections([newConnection, ...availableConnections]);
                if (activeTab === "connections") {
                    resetAndLoadConnectionsData();
                }
                toast.success(response.data.message);
            }

            setNewConnectionName("");
            setEditingConnection(null);
            setConnectionDialogOpen(false);
        } catch (error) {
            console.error('Error saving connection:', error);
            toast.error('Failed to save connection');
        } finally {
            setSavingState(null);
        }
    };

    const createSource = async () => {
        if (!newSourceName) {
            toast.error('Please enter a name');
            return;
        }

        const actionType = editingSource ? 'update-source' : 'add-source';
        setSavingState(actionType);

        try {
            if (editingSource) {
                const response = await axios.patch('/api/source', {
                    id: editingSource.id,
                    name: newSourceName,
                    type: newSourceType,
                    amount: newSourceAmount,
                    creditLimit: newSourceType === 'CREDIT' ? newSourceCreditLimit : undefined,
                    sharedLimit: newSourceType === 'CREDIT' ? newSourceSharedLimit : false,
                    cardNames: newSourceType === 'CREDIT' && newSourceSharedLimit ? newSourceCardNames : (newSourceType === 'CREDIT' ? [] : undefined)
                });
                await loadSources();
                setSourcesData(sourcesData.map(src => {
                    if (src.id === editingSource.id) {
                        const updated = response.data.source;
                        if (updated.cardNames && typeof updated.cardNames === 'string') {
                            try {
                                updated.cardNames = JSON.parse(updated.cardNames);
                            } catch {
                                updated.cardNames = [];
                            }
                        }
                        return updated;
                    }
                    return src;
                }));
                toast.success(response.data.message);
            } else {
                const response = await axios.post('/api/source', {
                    name: newSourceName,
                    type: newSourceType,
                    amount: newSourceAmount,
                    creditLimit: newSourceType === 'CREDIT' ? newSourceCreditLimit : undefined,
                    sharedLimit: newSourceType === 'CREDIT' ? newSourceSharedLimit : false,
                    cardNames: newSourceType === 'CREDIT' && newSourceSharedLimit ? newSourceCardNames : []
                });
                await loadSources();
                if (activeTab === "sources") {
                    resetAndLoadSourcesData();
                }
                toast.success(response.data.message);
            }

            setNewSourceName("");
            setNewSourceType("BANK");
            setNewSourceAmount(0);
            setNewSourceCreditLimit(0);
            setNewSourceSharedLimit(false);
            setNewSourceCardNames([]);
            setNewCardNameInput("");
            setEditingSource(null);
            setSourceDialogOpen(false);
        } catch (error) {
            console.error('Error saving source:', error);
            toast.error('Failed to save source');
        } finally {
            setSavingState(null);
        }
    };

    const closeTransactionDialog = () => {
        setTransactionDialogOpen(false);
    }

    const openEditTransaction = async (transaction: Transaction) => {
        await loadSources();
        setEditingTransaction(transaction);
        setTransactionTitle(transaction.title);
        setTransactionDescription(transaction.description || "");
        setTransactionAmount(transaction.amount);
        setTransactionDate(new Date(transaction.date));
        setTransactionType(transaction.type);
        setTransactionCategory(transaction.categoryId);
        setTransactionSource(transaction.sourceId);
        setTransactionDestination(transaction.destinationId || "");
        setTransactionSelectedCardName(transaction.selectedCardName || "");
        setTransactionSelectedDestinationCardName(transaction.selectedDestinationCardName || "");
        setTransactionSplitted(Boolean(transaction.splits && transaction.splits.length > 0));
        setSplitMethod(transaction.splitMethod || "equal");

        if (transaction.splits && transaction.splits.length > 0) {
            setAvailableConnections(availableConnections.map(conn => {
                const split = transaction.splits?.find(s =>
                    s.connectionId === conn.id || s.selfUserId === conn.id
                );
                if (split) {
                    return {
                        ...conn,
                        selected: true,
                        amount: split.amount || 0,
                        percentage: split.percentage || 0
                    };
                }
                return { ...conn, selected: false, amount: 0, percentage: 0 };
            }));
        }

        setTransactionDialogOpen(true);
    };

    const resetTransactionForm = () => {
        setEditingTransaction(null);
        setTransactionTitle("");
        setTransactionDescription("");
        setTransactionAmount(null);
        setTransactionDate(new Date());
        setTransactionType("EXPENSE");
        setTransactionCategory("");
        setTransactionSource("");
        setTransactionDestination("");
        setTransactionSelectedCardName("");
        setTransactionSelectedDestinationCardName("");
        setTransactionSplitted(false);
        setSplitMethod("equal");
        setAvailableConnections(availableConnections.map(conn => ({
            ...conn,
            selected: false,
            amount: 0,
            percentage: 0
        })));
        setTransactionDialogOpen(false);
    };

    const toggleConnectionSelection = (id: string) => {
        setAvailableConnections(availableConnections.map(conn =>
            conn.id === id ? { ...conn, selected: !conn.selected } : conn
        ));
    };

    const updateConnectionAmount = (id: string, amount: number) => {
        setAvailableConnections(availableConnections.map(conn =>
            conn.id === id ? { ...conn, amount } : conn
        ));
    };

    const updateConnectionPercentage = (id: string, percentage: number) => {
        setAvailableConnections(availableConnections.map(conn =>
            conn.id === id ? { ...conn, percentage } : conn
        ));
    };

    const getSelectedConnections = () => {
        return availableConnections.filter(conn => conn.selected);
    };

    const calculateEqualSplit = () => {
        const selected = getSelectedConnections();
        if (!transactionAmount || selected.length === 0) return 0;
        return transactionAmount / selected.length;
    };

    const calculateTotalPercentage = () => {
        const selected = getSelectedConnections();
        return selected.reduce((total, conn) => total + (conn.percentage || 0), 0);
    };

    const calculateTotalAmount = () => {
        const selected = getSelectedConnections();
        return selected.reduce((total, conn) => total + (conn.amount || 0), 0);
    };

    const saveTransaction = async () => {
        try {
            if (!transactionTitle || !transactionAmount || !transactionSource || !transactionCategory) {
                toast.error('Please fill required fields');
                return;
            }

            if (transactionType === 'TRANSFER' && !transactionDestination) {
                toast.error('Destination is required for transfers');
                return;
            }

            if ((transactionType === 'EXPENSE' || transactionType === 'TRANSFER') && transactionSource) {
                const selectedSource = sources.find(s => s.id === transactionSource);
                if (selectedSource?.type === 'CREDIT' && selectedSource?.sharedLimit) {
                    let cardNamesArray: string[] = [];
                    if (Array.isArray(selectedSource.cardNames)) {
                        cardNamesArray = selectedSource.cardNames;
                    } else if (selectedSource.cardNames && typeof selectedSource.cardNames === 'string') {
                        try {
                            const parsed = JSON.parse(selectedSource.cardNames);
                            cardNamesArray = Array.isArray(parsed) ? parsed : [];
                        } catch {
                            cardNamesArray = [];
                        }
                    }
                    if (cardNamesArray.length > 0 && !transactionSelectedCardName) {
                        toast.error('Please select a source card');
                        return;
                    }
                }
            }

            if (transactionType === 'TRANSFER' && transactionDestination) {
                const selectedDestination = sources.find(s => s.id === transactionDestination);
                if (selectedDestination?.type === 'CREDIT' && selectedDestination?.sharedLimit) {
                    let cardNamesArray: string[] = [];
                    if (Array.isArray(selectedDestination.cardNames)) {
                        cardNamesArray = selectedDestination.cardNames;
                    } else if (selectedDestination.cardNames && typeof selectedDestination.cardNames === 'string') {
                        try {
                            const parsed = JSON.parse(selectedDestination.cardNames);
                            cardNamesArray = Array.isArray(parsed) ? parsed : [];
                        } catch {
                            cardNamesArray = [];
                        }
                    }
                    if (cardNamesArray.length > 0 && !transactionSelectedDestinationCardName) {
                        toast.error('Please select a destination card');
                        return;
                    }
                }
            }

            const actionType = editingTransaction ? 'update-transaction' : 'add-transaction';
            setSavingState(actionType);

            const selectedForSplit = getSelectedConnections();

            const payload = {
                transactionAmount,
                transactionDate,
                transactionDescription,
                transactionType,
                transactionCategory,
                transactionTitle,
                transactionSource,
                transactionDestination: transactionType === 'TRANSFER' ? transactionDestination : undefined,
                transactionSelectedCardName: transactionSelectedCardName || undefined,
                transactionSelectedDestinationCardName: transactionType === 'TRANSFER' ? (transactionSelectedDestinationCardName || undefined) : undefined,
                transactionSplitted,
                splitMethod,
                connections: selectedForSplit,
            };

            let response: { data: { transaction: Transaction; message: string } };
            if (editingTransaction) {
                response = await axios.put('/api/transaction', {
                    ...payload,
                    id: editingTransaction.id
                });
                setTransactions(transactions.map(txn =>
                    txn.id === editingTransaction.id ? response.data.transaction : txn
                ));
            } else {
                response = await axios.post('/api/transaction', payload);
            }

            toast.success(response.data.message);
            resetTransactionForm();

            // Refresh data after transaction operations
            if (activeTab === "transactions") {
                resetAndLoadTransactions();
            }
            // Always refresh sources since balances are updated by transactions
            await loadSources();

        } catch (error) {
            console.error('Error saving transaction\n', error)
            toast.error('Error saving transaction')
        } finally {
            setSavingState(null);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <Navbar title="Money Manager" />

                <div className="flex gap-4 justify-between md:flex-row flex-col-reverse md:px-0 px-2">
                    <div
                        className="flex gap-2 items-center md:overflow-hidden overflow-x-auto"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        // @ts-expect-error Hide scrollbar for Webkit browsers
                        css={{
                            '&::-webkit-scrollbar': {
                                display: 'none'
                            }
                        }}
                    >
                        {tabs.map((tab) => (
                            <div key={tab.value} onClick={() => setActiveTab(tab.value)} className={`border px-2 py-1 rounded-md cursor-pointer hover:bg-muted ${activeTab === tab.value ? "bg-muted" : ""}`}>
                                <span className={`${activeTab === tab.value ? "font-bold" : ""} ${activeTab === tab.value ? "text-foreground" : ""}`}>{tab.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 md:overflow-hidden overflow-x-auto"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        // @ts-expect-error Hide scrollbar for Webkit browsers
                        css={{
                            '&::-webkit-scrollbar': {
                                display: 'none'
                            }
                        }}
                    >
                        <Button onClick={() => {
                            resetTransactionForm();
                            setTransactionDialogOpen(true)
                        }} size="sm" disabled={savingState !== null}>
                            Add Transaction
                        </Button>
                        <Button onClick={() => setCategoryDialogOpen(true)} variant="outline" size="sm" disabled={savingState !== null}>
                            Add Category
                        </Button>
                        <Button onClick={() => setConnectionDialogOpen(true)} variant="outline" size="sm" disabled={savingState !== null}>
                            Add Connection
                        </Button>
                        <Button onClick={() => setSourceDialogOpen(true)} variant="outline" size="sm" disabled={savingState !== null}>
                            Add Source
                        </Button>
                    </div>
                </div>


                <div className="border-0 md:border md:h-[calc(100vh-160px)] h-[calc(100vh-190px)] rounded-md overflow-hidden flex flex-col md:mx-0 mx-2">
                    {
                        activeTab === "transactions" && (
                            <div className="flex flex-col h-full">
                                <div className="p-0 md:p-4 border-b-0 md:border-b space-y-3 bg-muted/20 md:mb-0 mb-2">
                                    <div className="flex gap-1.5 md:gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by title or description..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8 md:pl-10 text-sm md:text-base h-9 md:h-10"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefresh}
                                            disabled={isRefreshing || loadingTransactions}
                                            className="h-9 w-9 md:h-10 md:w-10 p-0"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <Button
                                            variant={showFilters ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="relative h-9 md:h-10 px-2 md:px-4"
                                        >
                                            <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                                            <span className="hidden md:inline">Filters</span>
                                            {getActiveFilterCount() > 0 && (
                                                <Badge className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center text-[10px] md:text-xs" variant="secondary">
                                                    {getActiveFilterCount()}
                                                </Badge>
                                            )}
                                        </Button>
                                        {getActiveFilterCount() > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearAllFilters}
                                                className="h-9 md:h-10 px-2 md:px-4 hidden sm:flex"
                                            >
                                                <X className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                                                <span className="hidden md:inline">Clear</span>
                                            </Button>
                                        )}
                                    </div>

                                    {showFilters && (
                                        <div className="space-y-3 pt-2 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs md:text-sm font-medium">Date Range</Label>
                                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                                        <SelectTrigger className="h-9 md:h-10 text-sm">
                                                            <SelectValue placeholder="All time" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All time</SelectItem>
                                                            <SelectItem value="1day">Last 24 hours</SelectItem>
                                                            <SelectItem value="1week">Last 7 days</SelectItem>
                                                            <SelectItem value="1month">Last 30 days</SelectItem>
                                                            <SelectItem value="custom">Custom range</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs md:text-sm font-medium">Transaction Type</Label>
                                                    <div className="flex gap-1.5 md:gap-2">
                                                        <Button
                                                            variant={selectedTypes.includes("INCOME") ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => toggleType("INCOME")}
                                                            className="flex-1 h-9 md:h-10 px-1 md:px-3"
                                                        >
                                                            <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                                                            <span className="text-xs md:text-sm">Income</span>
                                                        </Button>
                                                        <Button
                                                            variant={selectedTypes.includes("EXPENSE") ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => toggleType("EXPENSE")}
                                                            className="flex-1 h-9 md:h-10 px-1 md:px-3"
                                                        >
                                                            <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                                                            <span className="text-xs md:text-sm">Expense</span>
                                                        </Button>
                                                        <Button
                                                            variant={selectedTypes.includes("TRANSFER") ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => toggleType("TRANSFER")}
                                                            className="flex-1 h-9 md:h-10 px-1 md:px-3"
                                                        >
                                                            <ArrowRightLeft className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
                                                            <span className="text-xs md:text-sm">Transfer</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {dateFilter === "custom" && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs md:text-sm font-medium">From Date</Label>
                                                        <DateTimePicker date={customDateFrom} setDate={setCustomDateFrom} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs md:text-sm font-medium">To Date</Label>
                                                        <DateTimePicker date={customDateTo} setDate={setCustomDateTo} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs md:text-sm font-medium">Categories</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="w-full justify-between h-9 md:h-10 text-sm">
                                                                {selectedCategories.length === 0 ? "All" : `${selectedCategories.length} selected`}
                                                                <ArrowUpDown className="h-3.5 w-3.5 md:h-4 md:w-4 ml-2" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[200px] p-2" align="start">
                                                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                                {categories.map((category) => (
                                                                    <div
                                                                        key={category.id}
                                                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                                                        onClick={() => toggleCategory(category.id)}
                                                                    >
                                                                        <Checkbox checked={selectedCategories.includes(category.id)} />
                                                                        <span className="text-xs md:text-sm">{category.emoji} {category.title}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs md:text-sm font-medium">Sources</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="w-full justify-between h-9 md:h-10 text-sm">
                                                                {selectedSources.length === 0 ? "All" : `${selectedSources.length} selected`}
                                                                <ArrowUpDown className="h-3.5 w-3.5 md:h-4 md:w-4 ml-2" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[200px] p-2" align="start">
                                                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                                {sources.map((source) => (
                                                                    <div
                                                                        key={source.id}
                                                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                                                        onClick={() => toggleSource(source.id)}
                                                                    >
                                                                        <Checkbox checked={selectedSources.includes(source.id)} />
                                                                        <span className="text-xs md:text-sm">
                                                                            {source.type === 'BANK' ? '🏦' : source.type === 'CASH' ? '💵' : '💳'} {source.name}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs md:text-sm font-medium">Connections</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className="w-full justify-between h-9 md:h-10 text-sm">
                                                                {selectedConnections.length === 0 ? "All" : `${selectedConnections.length} selected`}
                                                                <ArrowUpDown className="h-3.5 w-3.5 md:h-4 md:w-4 ml-2" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[200px] p-2" align="start">
                                                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                                {availableConnections.map((connection) => (
                                                                    <div
                                                                        key={connection.id}
                                                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                                                        onClick={() => toggleConnection(connection.id)}
                                                                    >
                                                                        <Checkbox checked={selectedConnections.includes(connection.id)} />
                                                                        <span className="text-xs md:text-sm flex items-center gap-1">
                                                                            {connection.isSelf && <span>👤</span>}
                                                                            {connection.name}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-0 md:p-4">
                                    {loadingTransactions && transactions.length === 0 ? (
                                        <div className={isMobile ? "space-y-2" : "space-y-3"}>
                                            {[...Array(6)].map((_, i) => (
                                                <Card key={i}>
                                                    <CardContent className={isMobile ? "px-2.5 py-2" : "p-4"}>
                                                        {isMobile ? (
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <Skeleton className="h-4 w-[140px]" />
                                                                    <Skeleton className="h-4 w-[60px]" />
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <Skeleton className="h-3 w-[80%]" />
                                                                    <Skeleton className="h-6 w-6 rounded" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                                    <div className="space-y-2 flex-1">
                                                                        <Skeleton className="h-4 w-[200px]" />
                                                                        <Skeleton className="h-3 w-[150px]" />
                                                                    </div>
                                                                </div>
                                                                <Skeleton className="h-6 w-[100px]" />
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : transactions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                            <div className="text-5xl md:text-6xl mb-4">📊</div>
                                            <h3 className="text-base md:text-lg font-semibold mb-2">No transactions found</h3>
                                            <p className="text-xs md:text-sm text-muted-foreground mb-4 max-w-md">
                                                {getActiveFilterCount() > 0
                                                    ? "Try adjusting your filters or search query"
                                                    : "Start tracking your finances by adding your first transaction"}
                                            </p>
                                            <Button onClick={() => setTransactionDialogOpen(true)} className="h-9 md:h-10">
                                                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                                                <span className="text-sm">Add Transaction</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className={isMobile ? "space-y-2" : "space-y-3"}>
                                            {transactions.map((transaction) => (
                                                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                                                    {isMobile ? (
                                                        <CardContent>
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <h3 className="font-semibold truncate text-lg flex-1">{transaction.title}</h3>
                                                                    <div className={`text-base font-bold shrink-0 ${transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' :
                                                                        transaction.type === 'EXPENSE' ? 'text-red-600 dark:text-red-400' :
                                                                            'text-blue-600 dark:text-blue-400'
                                                                        }`}>
                                                                        {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                                                                        ₹{transaction.amount.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-1 min-w-0 overflow-hidden">
                                                                        <span className="shrink-0">{transaction.category.emoji} {transaction.category.title}</span>
                                                                        <span className="shrink-0">•</span>
                                                                        {transaction.type === 'TRANSFER' ? (
                                                                            <>
                                                                                <span className="shrink-0">
                                                                                    {transaction.source.type === 'BANK' ? '🏦' :
                                                                                        transaction.source.type === 'CASH' ? '💵' : '💳'}
                                                                                </span>
                                                                                <span className="truncate">{transaction.source.name}</span>
                                                                                {transaction.selectedCardName && (
                                                                                    <>
                                                                                        <span className="shrink-0">•</span>
                                                                                        <span className="truncate text-xs">{transaction.selectedCardName}</span>
                                                                                    </>
                                                                                )}
                                                                                <span className="shrink-0">→</span>
                                                                                {transaction.destination && (
                                                                                    <>
                                                                                        <span className="shrink-0">
                                                                                            {transaction.destination.type === 'BANK' ? '🏦' :
                                                                                                transaction.destination.type === 'CASH' ? '💵' : '💳'}
                                                                                        </span>
                                                                                        <span className="truncate">{transaction.destination.name}</span>
                                                                                        {transaction.selectedDestinationCardName && (
                                                                                            <>
                                                                                                <span className="shrink-0">•</span>
                                                                                                <span className="truncate text-xs">{transaction.selectedDestinationCardName}</span>
                                                                                            </>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span className="shrink-0">
                                                                                    {transaction.source.type === 'BANK' ? '🏦' :
                                                                                        transaction.source.type === 'CASH' ? '💵' : '💳'}
                                                                                </span>
                                                                                <span className="truncate">{transaction.source.name}</span>
                                                                                {transaction.selectedCardName && (
                                                                                    <>
                                                                                        <span className="shrink-0">•</span>
                                                                                        <span className="truncate text-xs">{transaction.selectedCardName}</span>
                                                                                    </>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {transaction.splits && transaction.splits.length > 0 && (
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <span className="shrink-0 flex items-center cursor-pointer">
                                                                                        <span className="shrink-0">•</span>
                                                                                        <span className="shrink-0 ml-1">🤝</span>
                                                                                    </span>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-60 p-3" align="start">
                                                                                    <div className="text-xs font-medium mb-1">Split with:</div>
                                                                                    <p className="text-xs">
                                                                                        {transaction.splits
                                                                                            .map(split => split.connection?.name || 'Unknown')
                                                                                            .join(', ')
                                                                                        }
                                                                                    </p>
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                            <span className="shrink-0">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>                                                                        </div>
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 p-0 shrink-0"
                                                                                >
                                                                                    <span className="text-base leading-none">⋯</span>
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-32 p-1" align="end">
                                                                                <div className="space-y-1">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => openEditTransaction(transaction)}
                                                                                        className="w-full justify-start h-8 px-2 text-xs"
                                                                                    >
                                                                                        <Edit className="h-3 w-3 mr-2" />
                                                                                        Edit
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                                                        className="w-full justify-start h-8 px-2 text-xs text-destructive hover:text-destructive"
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                                                        Delete
                                                                                    </Button>
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    ) : (
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <span className="text-4xl flex items-center justify-center">{transaction.category.emoji}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="font-semibold text-base truncate">{transaction.title}</h3>
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {transaction.category.title}
                                                                            </Badge>
                                                                        </div>
                                                                        {transaction.description && (
                                                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                                                {transaction.description}
                                                                            </p>
                                                                        )}
                                                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                                            <div className="flex items-center gap-1">
                                                                                <Calendar className="h-3 w-3" />
                                                                                {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                                                                            </div>
                                                                            {transaction.type === 'TRANSFER' ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="shrink-0">
                                                                                        {transaction.source.type === 'BANK' ? '🏦' :
                                                                                            transaction.source.type === 'CASH' ? '💵' : '💳'}
                                                                                    </span>
                                                                                    <span>{transaction.source.name}</span>
                                                                                    {transaction.selectedCardName && (
                                                                                        <>
                                                                                            <span>•</span>
                                                                                            <span>{transaction.selectedCardName}</span>
                                                                                        </>
                                                                                    )}
                                                                                    {transaction.destination && (
                                                                                        <>
                                                                                            <span>→</span>
                                                                                            <span className="shrink-0">
                                                                                                {transaction.destination.type === 'BANK' ? '🏦' :
                                                                                                    transaction.destination.type === 'CASH' ? '💵' : '💳'}
                                                                                            </span>
                                                                                            <span>{transaction.destination.name}</span>
                                                                                            {transaction.selectedDestinationCardName && (
                                                                                                <>
                                                                                                    <span>•</span>
                                                                                                    <span>{transaction.selectedDestinationCardName}</span>
                                                                                                </>
                                                                                            )}
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-1">
                                                                                    {transaction.source.type === 'BANK' ? '🏦 ' :
                                                                                        transaction.source.type === 'CASH' ? '💵 ' : '💳 '}
                                                                                    {transaction.source.name}
                                                                                    {transaction.selectedCardName && (
                                                                                        <>
                                                                                            <span>•</span>
                                                                                            <span>{transaction.selectedCardName}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {transaction.splits && transaction.splits.length > 0 && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    Split with {transaction.splits.map(s => s.selfUser ? (s.selfUser.name || "Myself") : s.connection?.name).filter(Boolean).join(', ')}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-right flex items-center gap-2">
                                                                        {transaction.type === 'INCOME' ? (
                                                                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                                        ) : transaction.type === 'EXPENSE' ? (
                                                                            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                                        ) : (
                                                                            <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                        )}
                                                                        <div className={`text-lg font-bold ${transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' :
                                                                            transaction.type === 'EXPENSE' ? 'text-red-600 dark:text-red-400' :
                                                                                'text-blue-600 dark:text-blue-400'
                                                                            }`}>
                                                                            {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                                                                            ₹{transaction.amount.toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openEditTransaction(transaction)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    )}
                                                </Card>
                                            ))}

                                            {hasMore && (
                                                <div ref={observerTarget} className="py-4">
                                                    {loadingTransactions && (
                                                        <div className={isMobile ? "space-y-2" : "space-y-3"}>
                                                            {[...Array(3)].map((_, i) => (
                                                                <Card key={i}>
                                                                    <CardContent className={isMobile ? "px-2.5 py-2" : "p-4"}>
                                                                        {isMobile ? (
                                                                            <div className="space-y-0.5">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <Skeleton className="h-4 w-[140px]" />
                                                                                    <Skeleton className="h-4 w-[60px]" />
                                                                                </div>
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <Skeleton className="h-3 w-[80%]" />
                                                                                    <Skeleton className="h-6 w-6 rounded" />
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3 flex-1">
                                                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                                                    <div className="space-y-2 flex-1">
                                                                                        <Skeleton className="h-4 w-[200px]" />
                                                                                        <Skeleton className="h-3 w-[150px]" />
                                                                                    </div>
                                                                                </div>
                                                                                <Skeleton className="h-6 w-[100px]" />
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!hasMore && transactions.length > 0 && (
                                                <div className="text-center py-4 md:py-6 text-xs md:text-sm text-muted-foreground">
                                                    You&apos;ve reached the end of your transactions
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === "analytics" && (
                            <div className="flex flex-col h-full overflow-y-auto">
                                <div className="p-0 md:p-4 border-b-0 md:border-b space-y-3 md:bg-muted/20 bg-background sticky top-0 z-10 md:mb-0 mb-2">
                                    <div className="flex   items-center justify-between">
                                        <h2 className="text-lg md:text-xl font-bold">Financial Analytics</h2>
                                        <Select value={analyticsTimeRange} onValueChange={setAnalyticsTimeRange}>
                                            <SelectTrigger className="w-fit h-9 md:h-10 text-sm">
                                                <SelectValue placeholder="Select range" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1week">Last Week</SelectItem>
                                                <SelectItem value="1month">This Month</SelectItem>
                                                <SelectItem value="3months">Last 3 Months</SelectItem>
                                                <SelectItem value="6months">Last 6 Months</SelectItem>
                                                <SelectItem value="1year">Last Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {loadingAnalytics ? (
                                    <div className="p-3 md:p-4 space-y-4">
                                        {[...Array(6)].map((_, i) => (
                                            <Card key={i}>
                                                <CardHeader className="p-3 md:p-6">
                                                    <Skeleton className="h-5 md:h-6 w-[150px] md:w-[200px]" />
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    <Skeleton className="h-[200px] md:h-[300px] w-full" />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : !analyticsData || (analyticsData.totals.incomeCount + analyticsData.totals.expenseCount + analyticsData.totals.transferCount) === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
                                        <div className="text-5xl md:text-6xl mb-4">📊</div>
                                        <h3 className="text-base md:text-lg font-semibold mb-2">No Data Available</h3>
                                        <p className="text-xs md:text-sm text-muted-foreground mb-4 max-w-md">
                                            Add some transactions to see your analytics
                                        </p>
                                        <Button onClick={() => setTransactionDialogOpen(true)} className="h-9 md:h-10">
                                            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                                            <span className="text-sm">Add Transaction</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-0 md:p-4 space-y-4 md:space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                            <Card>
                                                <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                                                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                                        <span className="text-lg md:text-2xl font-bold text-green-600">₹{analyticsData.totals.income.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                        {analyticsData.totals.incomeCount} transactions
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                                                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                                                        <span className="text-lg md:text-2xl font-bold text-red-600">₹{analyticsData.totals.expenses.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                        {analyticsData.totals.expenseCount} transactions
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                                                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <ArrowUpDown className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                                        <span className={`text-lg md:text-2xl font-bold ${analyticsData.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            ₹{analyticsData.totals.balance.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Income - Expenses</p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                                                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <ArrowRightLeft className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                                                        <span className="text-lg md:text-2xl font-bold text-blue-600">₹{analyticsData.totals.transfers.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                        {analyticsData.totals.transferCount} transactions
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader className="p-3 md:p-6">
                                                <CardTitle className="text-sm md:text-base">Income vs Expenses Over Time</CardTitle>
                                                <CardDescription className="text-xs md:text-sm">Track your financial flow</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
                                                    <AreaChart data={analyticsData.timeSeriesData}>
                                                        <defs>
                                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" className="text-xs" />
                                                        <YAxis className="text-xs" />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                                                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                                            <Card>
                                                <CardHeader className="p-3 md:p-6">
                                                    <CardTitle className="text-sm md:text-base">Expenses by Category</CardTitle>
                                                    <CardDescription className="text-xs md:text-sm">See where your money goes</CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    {(() => {
                                                        const categoryData = analyticsData.categoryBreakdown;
                                                        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];
                                                        const pieData = categoryData.map((cat: { id: string; name: string; emoji: string; amount: number; count: number }, index: number) => ({
                                                            name: `${cat.emoji} ${cat.name}`,
                                                            value: cat.amount,
                                                            color: COLORS[index % COLORS.length]
                                                        }));

                                                        return categoryData.length > 0 ? (
                                                            <div className="space-y-3 md:space-y-4">
                                                                <ResponsiveContainer width="100%" height={200} className="md:!h-[250px]">
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={pieData}
                                                                            cx="50%"
                                                                            cy="50%"
                                                                            labelLine={false}
                                                                            label={(entry) => `${entry.name.split(' ').slice(-1)}`}
                                                                            outerRadius={60}
                                                                            className="md:!outerRadius-[80]"
                                                                            fill="#8884d8"
                                                                            dataKey="value"
                                                                        >
                                                                            {pieData.map((entry: { name: string; value: number; color: string }, index: number) => (
                                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                                            ))}
                                                                        </Pie>
                                                                        <Tooltip />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                                <div className="space-y-1.5 md:space-y-2">
                                                                    {categoryData.slice(0, 5).map((cat: { id: string; name: string; emoji: string; amount: number; count: number }, index: number) => (
                                                                        <div key={index} className="flex items-center justify-between text-xs md:text-sm">
                                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                                                <span className="truncate">{cat.emoji} {cat.name}</span>
                                                                            </div>
                                                                            <span className="font-semibold ml-2">₹{cat.amount.toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">No expense data available</p>
                                                        );
                                                    })()}
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="p-3 md:p-6">
                                                    <CardTitle className="text-sm md:text-base">Source Balance Impact</CardTitle>
                                                    <CardDescription className="text-xs md:text-sm">Net change per source</CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                    {(() => {
                                                        const sourceData = analyticsData.sourceBreakdown;
                                                        return sourceData.length > 0 ? (
                                                            <div className="space-y-2.5 md:space-y-3">
                                                                {sourceData.slice(0, 8).map((source: { id: string; name: string; type: string; amount: number; count: number }, index: number) => (
                                                                    <div key={index} className="space-y-0.5 md:space-y-1">
                                                                        <div className="flex items-center justify-between text-xs md:text-sm">
                                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                                <span>{source.type === 'BANK' ? '🏦' : source.type === 'CASH' ? '💵' : '💳'}</span>
                                                                                <span className="font-medium truncate">{source.name}</span>
                                                                            </div>
                                                                            <span className={`font-semibold ml-2 ${source.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                {source.amount >= 0 ? '+' : ''}₹{source.amount.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[10px] md:text-xs text-muted-foreground">{source.count} transactions</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">No source data available</p>
                                                        );
                                                    })()}
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader className="p-3 md:p-6">
                                                <CardTitle className="text-sm md:text-base">Top 10 Transactions</CardTitle>
                                                <CardDescription className="text-xs md:text-sm">Highest value transactions in this period</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                                <div className="space-y-2 md:space-y-3">
                                                    {analyticsData.topTransactions.map((transaction: { id: string; title: string; amount: number; date: Date; type: string; category: { emoji: string; title: string } }, index: number) => (
                                                        <div key={transaction.id} className="flex items-center justify-between p-2 md:p-3 rounded-lg border">
                                                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                                                <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-xs md:text-sm font-bold shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                                                        <span className="font-semibold text-xs md:text-sm truncate">{transaction.title}</span>
                                                                        <Badge variant="outline" className="text-[10px] md:text-xs w-fit">
                                                                            {transaction.category.emoji} {transaction.category.title}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-[10px] md:text-xs text-muted-foreground">
                                                                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`text-sm md:text-lg font-bold ml-2 shrink-0 ${transaction.type === 'INCOME' ? 'text-green-600' :
                                                                transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                                                                }`}>
                                                                {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                                                                ₹{transaction.amount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {
                        activeTab === "categories" && (
                            <div className="flex flex-col h-full">
                                <div className="p-0 md:p-4 border-b-0 md:border-b space-y-3 bg-muted/20 md:mb-0 mb-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search categories by title..."
                                                value={categorySearchQuery}
                                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefreshCategories}
                                            disabled={isRefreshingCategories || loadingCategories}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isRefreshingCategories ? 'animate-spin' : ''}`} />
                                        </Button>
                                        {categorySearchQuery && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCategorySearchQuery("")}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-0 md:p-4">
                                    {loadingCategories && categoriesData.length === 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {[...Array(6)].map((_, i) => (
                                                <Card key={i}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-12 w-12 rounded-lg" />
                                                            <div className="space-y-2 flex-1">
                                                                <Skeleton className="h-4 w-[120px]" />
                                                                <Skeleton className="h-3 w-[80px]" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : categoriesData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <div className="text-6xl mb-4">📁</div>
                                            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {categorySearchQuery
                                                    ? "Try a different search term"
                                                    : "Create your first category to organize transactions"}
                                            </p>
                                            <Button onClick={() => setCategoryDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Category
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {categoriesData.map((category) => (
                                                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                                                        <CardContent>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="text-4xl bg-muted/50 p-2 rounded-lg">
                                                                        {category.emoji}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-base truncate">
                                                                            {category.title}
                                                                        </h3>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {format(new Date(category.createdAt), 'MMM dd, yyyy')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditCategory(category)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>

                                            {hasMoreCategories && (
                                                <div ref={categoriesObserverTarget} className="py-4">
                                                    {loadingCategories && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {[...Array(3)].map((_, i) => (
                                                                <Card key={i}>
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Skeleton className="h-12 w-12 rounded-lg" />
                                                                            <div className="space-y-2 flex-1">
                                                                                <Skeleton className="h-4 w-[120px]" />
                                                                                <Skeleton className="h-3 w-[80px]" />
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!hasMoreCategories && categoriesData.length > 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground">
                                                    You&apos;ve reached the end of your categories
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === "connections" && (
                            <div className="flex flex-col h-full">
                                <div className="md:p-4 p-0 border-b-0 md:border-b space-y-3 bg-muted/20 md:mb-0 mb-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search connections by name..."
                                                value={connectionSearchQuery}
                                                onChange={(e) => setConnectionSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefreshConnections}
                                            disabled={isRefreshingConnections || loadingConnections}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isRefreshingConnections ? 'animate-spin' : ''}`} />
                                        </Button>
                                        {connectionSearchQuery && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConnectionSearchQuery("")}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-0 md:p-4">
                                    {loadingConnections && connectionsData.length === 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {[...Array(6)].map((_, i) => (
                                                <Card key={i}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-12 w-12 rounded-full" />
                                                            <div className="space-y-2 flex-1">
                                                                <Skeleton className="h-4 w-[150px]" />
                                                                <Skeleton className="h-3 w-[100px]" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : connectionsData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <div className="text-6xl mb-4">👥</div>
                                            <h3 className="text-lg font-semibold mb-2">No connections found</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {connectionSearchQuery
                                                    ? "Try a different search term"
                                                    : "Add people you split expenses with"}
                                            </p>
                                            <Button onClick={() => setConnectionDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Connection
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {connectionsData.map((connection) => (
                                                    <Card key={connection.id} className="hover:shadow-md transition-shadow">
                                                        <CardContent>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                                        {connection.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-base truncate">
                                                                            {connection.name}
                                                                        </h3>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Added {format(new Date(connection.createdAt), 'MMM dd, yyyy')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditConnection(connection)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>

                                            {hasMoreConnections && (
                                                <div ref={connectionsObserverTarget} className="py-4">
                                                    {loadingConnections && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {[...Array(3)].map((_, i) => (
                                                                <Card key={i}>
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Skeleton className="h-12 w-12 rounded-full" />
                                                                            <div className="space-y-2 flex-1">
                                                                                <Skeleton className="h-4 w-[150px]" />
                                                                                <Skeleton className="h-3 w-[100px]" />
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!hasMoreConnections && connectionsData.length > 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground">
                                                    You&apos;ve reached the end of your connections
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === "sources" && (
                            <div className="flex flex-col h-full">
                                <div className="md:p-4 p-0 border-b-0 md:border-b space-y-3 bg-muted/20 md:mb-0 mb-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search sources by name..."
                                                value={sourceSearchQuery}
                                                onChange={(e) => setSourceSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefreshSources}
                                            disabled={isRefreshingSources || loadingSources}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isRefreshingSources ? 'animate-spin' : ''}`} />
                                        </Button>
                                        {sourceSearchQuery && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSourceSearchQuery("")}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-0 md:p-4">
                                    {loadingSources && sourcesData.length === 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {[...Array(6)].map((_, i) => (
                                                <Card key={i}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-14 w-14 rounded-lg" />
                                                            <div className="space-y-2 flex-1">
                                                                <Skeleton className="h-4 w-[150px]" />
                                                                <Skeleton className="h-3 w-[100px]" />
                                                                <Skeleton className="h-5 w-[120px]" />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : sourcesData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <div className="text-6xl mb-4">💰</div>
                                            <h3 className="text-lg font-semibold mb-2">No sources found</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {sourceSearchQuery
                                                    ? "Try a different search term"
                                                    : "Add payment sources like bank accounts, cash, or credit cards"}
                                            </p>
                                            <Button onClick={() => setSourceDialogOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Source
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {sourcesData.map((source) => (
                                                    <Card key={source.id} className="hover:shadow-md transition-shadow">
                                                        <CardContent>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="text-4xl bg-muted/50 p-2 rounded-lg">
                                                                        {source.type === 'BANK' ? '🏦' : source.type === 'CASH' ? '💵' : '💳'}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-base truncate">
                                                                            {source.name}
                                                                        </h3>
                                                                        <p className="text-xs text-muted-foreground mb-1">
                                                                            {source.type}
                                                                        </p>
                                                                        {source.type === 'CREDIT' && source.creditLimit ? (
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                                                                    Outstanding: ₹{source.amount.toFixed(2)}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    ₹{(source.creditLimit - source.amount).toFixed(2)} / ₹{source.creditLimit.toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                                                                ₹{source.amount.toFixed(2)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditSource(source)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>

                                            {hasMoreSources && (
                                                <div ref={sourcesObserverTarget} className="py-4">
                                                    {loadingSources && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {[...Array(3)].map((_, i) => (
                                                                <Card key={i}>
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Skeleton className="h-14 w-14 rounded-lg" />
                                                                            <div className="space-y-2 flex-1">
                                                                                <Skeleton className="h-4 w-[150px]" />
                                                                                <Skeleton className="h-3 w-[100px]" />
                                                                                <Skeleton className="h-5 w-[120px]" />
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!hasMoreSources && sourcesData.length > 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground">
                                                    You&apos;ve reached the end of your sources
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    }
                </div>

            </div>

            <Dialog open={transactionDialogOpen} onOpenChange={(open) => {
                setTransactionDialogOpen(open);
                if (open) {
                    loadSources();
                }
            }}>
                <DialogContent className="md:min-w-3xl min-w-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                        <DialogDescription>
                            Track your income, expenses, and transfers with detailed information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="transaction-title" className="px-1">Title *</Label>
                            <Input type="text" placeholder="e.g., Grocery Shopping" value={transactionTitle} onChange={(e) => setTransactionTitle(e.target.value)} id="transaction-title" />
                        </div>

                        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="transaction-amount" className="px-1">
                                    Amount *
                                </Label>
                                <Input type="number" placeholder="0.00" value={transactionAmount || ""} onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                        setTransactionAmount(null);
                                    } else {
                                        const numValue = Number(value);
                                        if (!isNaN(numValue)) {
                                            setTransactionAmount(numValue);
                                        }
                                    }
                                }}
                                    id="transaction-amount" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>

                            <DateTimePicker date={transactionDate} setDate={(date) => setTransactionDate(date || new Date())} />
                        </div>

                        <div className="flex flex-col md:flex-row md:gap-4 gap-2 w-full">
                            <div className="flex flex-col gap-1 md:w-1/2 w-full">
                                <Label htmlFor="transaction-type" className="px-1">Type *</Label>
                                <Select value={transactionType} onValueChange={(value) => {
                                    const newType = value as TransactionType;
                                    setTransactionType(newType);
                                    setTransactionSelectedCardName("");
                                    setTransactionSelectedDestinationCardName("");
                                    if (newType === 'INCOME' && transactionSource) {
                                        const selectedSource = sources.find(s => s.id === transactionSource);
                                        if (selectedSource?.type === 'CREDIT') {
                                            setTransactionSource("");
                                        }
                                    }
                                }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">💰 Income</SelectItem>
                                        <SelectItem value="EXPENSE">💸 Expense</SelectItem>
                                        <SelectItem value="TRANSFER">🔄 Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1 md:w-1/2 w-full ">
                                <div className="flex items-center justify-between px-1">
                                    <Label htmlFor="transaction-category">Category *</Label>
                                </div>
                                <div className="flex gap-2 items-center w-full">
                                    <div className="flex-1">
                                        <Select value={transactionCategory} onValueChange={(value) => setTransactionCategory(value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.length === 0 ? (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        No categories yet
                                                    </div>
                                                ) : (
                                                    categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.emoji} {category.title}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex-shrink-0"
                                        onClick={() => {
                                            setCategoryDialogOpen(true);
                                        }}
                                    >
                                        <Plus />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="transaction-source">{transactionType === 'TRANSFER' ? 'From *' : 'Source *'}</Label>
                            </div>
                            <div className="flex gap-2 w-full items-center">
                                <Select value={transactionSource} onValueChange={(value) => {
                                    setTransactionSource(value);
                                    setTransactionSelectedCardName("");
                                    if (transactionType === 'TRANSFER') {
                                        setTransactionSelectedDestinationCardName("");
                                    }
                                }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={transactionType === 'TRANSFER' ? "Select source" : "Select source"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sources.length === 0 ? (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No sources yet
                                            </div>
                                        ) : (
                                            sources.filter(source => {
                                                if (transactionType === 'INCOME') {
                                                    return source.type !== 'CREDIT';
                                                }
                                                return true;
                                            }).map((source) => (
                                                <SelectItem key={source.id} value={source.id}>
                                                    {source.type === 'BANK' ? '🏦' : source.type === 'CASH' ? '💵' : '💳'} {source.name}
                                                    {source.type === 'CREDIT' && source.creditLimit ?
                                                        ` (₹${source.amount.toFixed(2)} / ₹${source.creditLimit.toFixed(2)})`
                                                        : ` (₹${source.amount.toFixed(2)})`
                                                    }
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setSourceDialogOpen(true);
                                    }}
                                >
                                    <Plus />
                                </Button>
                            </div>
                        </div>

                        {(() => {
                            if (transactionType !== 'EXPENSE' && transactionType !== 'TRANSFER') return null;
                            if (!transactionSource) return null;

                            const selectedSource = sources.find(s => s.id === transactionSource);
                            if (!selectedSource || selectedSource.type !== 'CREDIT') return null;

                            const hasSharedLimit = Boolean(selectedSource.sharedLimit);
                            if (!hasSharedLimit) return null;

                            let cardNamesArray: string[] = [];
                            const cardNames = selectedSource.cardNames;

                            if (cardNames) {
                                if (Array.isArray(cardNames)) {
                                    cardNamesArray = cardNames;
                                } else if (typeof cardNames === 'string') {
                                    try {
                                        const parsed = JSON.parse(cardNames);
                                        cardNamesArray = Array.isArray(parsed) ? parsed : [];
                                    } catch (e) {
                                        cardNamesArray = [];
                                    }
                                }
                            }

                            if (!Array.isArray(cardNamesArray) || cardNamesArray.length === 0) {
                                return null;
                            }

                            return (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between px-1">
                                        <Label htmlFor="transaction-card">{transactionType === 'TRANSFER' ? 'Select Source Card *' : 'Select Card *'}</Label>
                                    </div>
                                    <Select value={transactionSelectedCardName} onValueChange={(value) => setTransactionSelectedCardName(value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={transactionType === 'TRANSFER' ? "Select source card" : "Select card"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cardNamesArray.map((cardName: string, index: number) => (
                                                <SelectItem key={index} value={cardName}>
                                                    {cardName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })()}

                        {transactionType === 'TRANSFER' && (
                            <>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between px-1">
                                        <Label htmlFor="transaction-destination">To *</Label>
                                    </div>
                                    <div className="flex gap-2 w-full items-center">
                                        <Select value={transactionDestination} onValueChange={(value) => {
                                            setTransactionDestination(value);
                                            setTransactionSelectedDestinationCardName("");
                                        }}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select destination" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sources.length === 0 ? (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        No sources yet
                                                    </div>
                                                ) : (
                                                    sources.filter(source => source.id !== transactionSource).map((source) => (
                                                        <SelectItem key={source.id} value={source.id}>
                                                            {source.type === 'BANK' ? '🏦' : source.type === 'CASH' ? '💵' : '💳'} {source.name}
                                                            {source.type === 'CREDIT' && source.creditLimit ?
                                                                ` (₹${source.amount.toFixed(2)} / ₹${source.creditLimit.toFixed(2)})`
                                                                : ` (₹${source.amount.toFixed(2)})`
                                                            }
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setSourceDialogOpen(true);
                                            }}
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                </div>
                                {(() => {
                                    if (!transactionDestination) return null;

                                    const selectedDestination = sources.find(s => s.id === transactionDestination);
                                    if (!selectedDestination || selectedDestination.type !== 'CREDIT') return null;

                                    const hasSharedLimit = Boolean(selectedDestination.sharedLimit);
                                    if (!hasSharedLimit) return null;

                                    let cardNamesArray: string[] = [];
                                    const cardNames = selectedDestination.cardNames;

                                    if (cardNames) {
                                        if (Array.isArray(cardNames)) {
                                            cardNamesArray = cardNames;
                                        } else if (typeof cardNames === 'string') {
                                            try {
                                                const parsed = JSON.parse(cardNames);
                                                cardNamesArray = Array.isArray(parsed) ? parsed : [];
                                            } catch (e) {
                                                cardNamesArray = [];
                                            }
                                        }
                                    }

                                    if (!Array.isArray(cardNamesArray) || cardNamesArray.length === 0) {
                                        return null;
                                    }

                                    return (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between px-1">
                                                <Label htmlFor="transaction-destination-card">Select Destination Card *</Label>
                                            </div>
                                            <Select value={transactionSelectedDestinationCardName} onValueChange={(value) => setTransactionSelectedDestinationCardName(value)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select destination card" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cardNamesArray.map((cardName: string, index: number) => (
                                                        <SelectItem key={index} value={cardName}>
                                                            {cardName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="transaction-description" className="px-1">Description</Label>
                            <Textarea
                                placeholder="Add any additional notes..."
                                value={transactionDescription}
                                onChange={(e) => setTransactionDescription(e.target.value)}
                                id="transaction-description"
                                rows={3}
                            />
                        </div>

                        {transactionType === 'EXPENSE' && <div className="flex flex-col gap-3">

                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Checkbox id="terms" checked={transactionSplitted} onCheckedChange={(checked) => setTransactionSplitted(checked as boolean)} />
                                <Label htmlFor="terms" className="cursor-pointer">Split this expense with others</Label>
                            </div>

                            {transactionSplitted && (
                                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Select People to Split With</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setConnectionDialogOpen(true)}
                                            className="flex items-center gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add Connection
                                        </Button>
                                    </div>

                                    {availableConnections.length === 0 ? (
                                        <div className="text-sm text-muted-foreground text-center py-4">
                                            No connections available. Add a connection to split expenses.
                                        </div>
                                    ) : (
                                        <>
                                            <Tabs value={splitMethod} onValueChange={(value) => setSplitMethod(value as SplitMethod)}>
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="equal">Equal</TabsTrigger>
                                                    <TabsTrigger value="percentage">Percentage</TabsTrigger>
                                                    <TabsTrigger value="amount">Amount</TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="equal" className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        Amount will be split equally among {getSelectedConnections().length} selected {getSelectedConnections().length === 1 ? 'person' : 'people'}
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {availableConnections.map((connection) => (
                                                            <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                                <Checkbox
                                                                    checked={connection.selected}
                                                                    onCheckedChange={() => toggleConnectionSelection(connection.id)}
                                                                />
                                                                <Label className="flex-1 cursor-pointer flex items-center gap-1" onClick={() => toggleConnectionSelection(connection.id)}>
                                                                    {connection.isSelf && <span>👤</span>}
                                                                    {connection.name}
                                                                </Label>
                                                                {connection.selected && (
                                                                    <div className="text-sm font-medium min-w-[80px] text-right">
                                                                        ₹{calculateEqualSplit().toFixed(2)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="percentage" className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        Total: {calculateTotalPercentage()}%
                                                        {calculateTotalPercentage() !== 100 && (
                                                            <span className="text-red-500 ml-2">
                                                                (Must equal 100%)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {availableConnections.map((connection) => (
                                                            <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                                <Checkbox
                                                                    checked={connection.selected}
                                                                    onCheckedChange={() => toggleConnectionSelection(connection.id)}
                                                                />
                                                                <Label className="flex-1 cursor-pointer flex items-center gap-1" onClick={() => toggleConnectionSelection(connection.id)}>
                                                                    {connection.isSelf && <span>👤</span>}
                                                                    {connection.name}
                                                                </Label>
                                                                {connection.selected && (
                                                                    <>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="%"
                                                                            value={connection.percentage || ""}
                                                                            onChange={(e) => updateConnectionPercentage(connection.id, Number(e.target.value) || 0)}
                                                                            className="w-20"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <div className="text-sm font-medium min-w-[80px] text-right">
                                                                            ₹{transactionAmount ? ((transactionAmount * (connection.percentage || 0)) / 100).toFixed(2) : "0.00"}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="amount" className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        Total: ₹{calculateTotalAmount().toFixed(2)}
                                                        {transactionAmount && calculateTotalAmount() !== transactionAmount && (
                                                            <span className="text-red-500 ml-2">
                                                                (Must equal ₹{transactionAmount})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {availableConnections.map((connection) => (
                                                            <div key={connection.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                                                <Checkbox
                                                                    checked={connection.selected}
                                                                    onCheckedChange={() => toggleConnectionSelection(connection.id)}
                                                                />
                                                                <Label className="flex-1 cursor-pointer flex items-center gap-1" onClick={() => toggleConnectionSelection(connection.id)}>
                                                                    {connection.isSelf && <span>👤</span>}
                                                                    {connection.name}
                                                                </Label>
                                                                {connection.selected && (
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Amount"
                                                                        value={connection.amount || ""}
                                                                        onChange={(e) => updateConnectionAmount(connection.id, Number(e.target.value) || 0)}
                                                                        className="w-24"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                        }

                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={resetTransactionForm} variant="outline" disabled={savingState !== null}>Cancel</Button>
                        <Button onClick={saveTransaction} className={`w-[${editingTransaction ? '160px' : '135px'}]`} disabled={savingState !== null}>
                            {(savingState === 'add-transaction' || savingState === 'update-transaction') ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving</> : editingTransaction ? "Update Transaction" : "Add Transaction"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
                if (!open) closeEditCategory();
                else setCategoryDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update your category details.' : 'Add a new category to organize your transactions better.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Category Details *</Label>
                            <div className="flex gap-3 items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                        >
                                            {newCategoryEmoji || "😀"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0 border-0" align="start">
                                        <EmojiPicker
                                            onEmojiClick={(emojiData: EmojiClickData) => {
                                                setNewCategoryEmoji(emojiData.emoji);
                                            }}
                                            width="100%"
                                            height="400px"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    id="category-title"
                                    placeholder="e.g., Food & Dining"
                                    value={newCategoryTitle}
                                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Click the emoji to pick one, then enter a category name</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={closeEditCategory} variant="outline" disabled={savingState !== null}>Cancel</Button>
                        <Button onClick={createCategory} disabled={savingState !== null} className="min-w-[150px]">
                            {savingState === 'add-category' || savingState === 'update-category' ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving</>
                            ) : (
                                editingCategory ? 'Update Category' : 'Create Category'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={connectionDialogOpen} onOpenChange={(open) => {
                if (!open) closeEditConnection();
                else setConnectionDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingConnection ? 'Edit Connection' : 'Add Connection'}</DialogTitle>
                        <DialogDescription>
                            {editingConnection ? 'Update connection details.' : 'Add a person you frequently split expenses with.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="connection-name">Name *</Label>
                            <Input
                                id="connection-name"
                                placeholder="e.g., John Doe"
                                value={newConnectionName}
                                onChange={(e) => setNewConnectionName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">You can select this person when splitting expenses</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={closeEditConnection} variant="outline" disabled={savingState !== null}>Cancel</Button>
                        <Button onClick={createConnection} disabled={savingState !== null} className="min-w-[160px]">
                            {savingState === 'add-connection' || savingState === 'update-connection' ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving</>
                            ) : (
                                editingConnection ? 'Update Connection' : 'Add Connection'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={sourceDialogOpen} onOpenChange={(open) => {
                if (!open) closeEditSource();
                else setSourceDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingSource ? 'Edit Source' : 'Add Source'}</DialogTitle>
                        <DialogDescription>
                            {editingSource ? 'Update source details.' : 'Add a payment source like bank account, cash, or credit card.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-name">Name *</Label>
                            <Input
                                id="source-name"
                                placeholder="e.g., HDFC Bank"
                                value={newSourceName}
                                onChange={(e) => setNewSourceName(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-type">Type *</Label>
                            <Select value={newSourceType} onValueChange={(value) => setNewSourceType(value as SourceType)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">🏦 Bank</SelectItem>
                                    <SelectItem value="CASH">💵 Cash</SelectItem>
                                    <SelectItem value="CREDIT">💳 Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="source-amount">{newSourceType === 'CREDIT' ? 'Current Outstanding Amount' : 'Current Balance'}</Label>
                            <Input
                                id="source-amount"
                                type="number"
                                placeholder="0.00"
                                value={newSourceAmount || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                        setNewSourceAmount(0);
                                    } else {
                                        const numValue = Number(value);
                                        if (!isNaN(numValue)) {
                                            setNewSourceAmount(numValue);
                                        }
                                    }
                                }}
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <p className="text-xs text-muted-foreground">{newSourceType === 'CREDIT' ? 'Enter the current outstanding amount on this card' : 'Enter the current balance in this source'}</p>
                        </div>

                        {newSourceType === 'CREDIT' && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="source-credit-limit">Total Credit Limit</Label>
                                    <Input
                                        id="source-credit-limit"
                                        type="number"
                                        placeholder="0.00"
                                        value={newSourceCreditLimit || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === "") {
                                                setNewSourceCreditLimit(0);
                                            } else {
                                                const numValue = Number(value);
                                                if (!isNaN(numValue)) {
                                                    setNewSourceCreditLimit(numValue);
                                                }
                                            }
                                        }}
                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <p className="text-xs text-muted-foreground">Enter the total credit limit for this card</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Checkbox id="shared-limit" checked={newSourceSharedLimit} onCheckedChange={(checked) => setNewSourceSharedLimit(checked as boolean)} />
                                    <Label htmlFor="shared-limit" className="cursor-pointer">Shared Limit (Multiple cards from different banks)</Label>
                                </div>
                                {newSourceSharedLimit && (
                                    <div className="flex flex-col gap-2">
                                        <Label>Card Names</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter card name"
                                                value={newCardNameInput}
                                                onChange={(e) => setNewCardNameInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newCardNameInput.trim()) {
                                                        e.preventDefault();
                                                        if (!newSourceCardNames.includes(newCardNameInput.trim())) {
                                                            setNewSourceCardNames([...newSourceCardNames, newCardNameInput.trim()]);
                                                            setNewCardNameInput("");
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    if (newCardNameInput.trim() && !newSourceCardNames.includes(newCardNameInput.trim())) {
                                                        setNewSourceCardNames([...newSourceCardNames, newCardNameInput.trim()]);
                                                        setNewCardNameInput("");
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        {newSourceCardNames.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {newSourceCardNames.map((cardName, index) => (
                                                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md">
                                                        <span className="text-sm">{cardName}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0"
                                                            onClick={() => {
                                                                setNewSourceCardNames(newSourceCardNames.filter((_, i) => i !== index));
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground">Add card names that share this credit limit</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button onClick={closeEditSource} variant="outline" disabled={savingState !== null}>Cancel</Button>
                        <Button onClick={createSource} disabled={savingState !== null} className="min-w-[140px]">
                            {savingState === 'add-source' || savingState === 'update-source' ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving</>
                            ) : (
                                editingSource ? 'Update Source' : 'Add Source'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}