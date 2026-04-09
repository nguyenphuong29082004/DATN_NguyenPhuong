import { useState, useCallback, useRef } from 'react';
import { container } from '../../di/container';

const PAGE_SIZE = 20;

export function useShootWardrobe(userId) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const searchRef = useRef('');

    const fetchItems = useCallback(async (newOffset = 0, reset = false, search = searchRef.current) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const wardrobeRepo = container.getWardrobeRepository();
            const data = await wardrobeRepo.findShootableItems(userId, newOffset, PAGE_SIZE, search);
            if (reset) {
                setItems(data);
            } else {
                setItems(prev => [...prev, ...data]);
            }
            setHasMore(data.length === PAGE_SIZE);
            setOffset(newOffset + data.length);
        } catch (err) {
            console.error('Error fetching wardrobe:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) fetchItems(offset);
    }, [isLoading, hasMore, offset, fetchItems]);

    const search = useCallback((query) => {
        searchRef.current = query;
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchItems(0, true, query);
    }, [fetchItems]);

    const reset = useCallback(() => {
        searchRef.current = '';
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchItems(0, true, '');
    }, [fetchItems]);

    return { items, isLoading, hasMore, loadMore, reset, search, fetchItems };
}
