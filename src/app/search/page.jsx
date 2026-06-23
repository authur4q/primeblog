"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/navbar/navbar';
import Loading from '@/app/components/loading/page';
import Link from 'next/link';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) return <Loading />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {results.length > 0 ? (
        results.map(post => (
          <div 
            key={post._id} 
            style={{ 
              padding: '1.5rem', borderRadius: '12px', backgroundColor: '#111', 
              border: '1px solid #222' 
            }}
          >
            <Link href={`/blog/${post._id}`} style={{ textDecoration: 'none', color: '#fff' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{post.title}</h3>
            </Link>
            <p style={{ color: '#aaa', margin: 0, lineHeight: '1.6' }}>{post.description}</p>
          </div>
        ))
      ) : (
        <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>No posts found for this tag.</p>
      )}
    </div>
  );
}


export default function SearchPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
          Search Results
        </h1>
        <Suspense fallback={<Loading />}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}