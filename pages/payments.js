import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'

export default function PaymentsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [lang, setLang] = useState('FR')

  useEffect(() => {
    const saved = localStorage.getItem('melofy_lang') || 'FR'
    setLang(saved)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) { window.location.href = '/login'; return }
        setUser(currentUser)
        const { data: ordersData } = await supabase
          .from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
        if (ordersData) setOrders(ordersData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatAmount = (amount, currency) => {
    const val = (amount / 100).toFixed(0)
    return `${Number(val).toLocaleString()} ${currency || 'XOF'}`
  }

  const totalSpent = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0)
  const totalPaid = orders.filter(o => o.status === 'paid').length
  const totalCredits = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.credits_awarded || 0), 0)

  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid': return { bg: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'rgba(16,185,129,0.2)', label: lang === 'FR' ? 'Réussi' : 'Paid', dot: '#10B981' }
      case 'failed': return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'rgba(239,68,68,0.2)', label: lang === 'FR' ? 'Échoué' : 'Failed', dot: '#EF4444' }
      default: return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.2)', label: lang === 'FR' ? 'En attente' : 'Pending', dot: '#F59E0B' }
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return lang === 'FR' ? "Aujourd'hui" : 'Today'
    if (diffDays === 1) return lang === 'FR' ? 'Hier' : 'Yesterday'
    return d.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })

  // Group by date
  const grouped = orders.reduce((acc, order) => {
    const key = formatDate(order.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(order)
    return acc
  }, {})

  return (
    <>
      <Head>
        <title>{lang === 'FR' ? 'Paiements · Melofy' : 'Payments · Melofy'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
        <Sidebar user={user} />

        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {lang === 'FR' ? 'Paiements' : 'Payments'}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  {lang === 'FR' ? 'Historique de vos transactions' : 'Your transaction history'}
                </p>
              </div>
              <Link href="/pricing" style={{
                display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                background: 'linear-gradient(135deg, #6C63FF, #a855f7)', color: '#fff',
                padding: '10px 20px', borderRadius: 40, fontSize: 13, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(108,99,255,0.3)', whiteSpace: 'nowrap'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {lang === 'FR' ? 'Acheter des crédits' : 'Buy credits'}
              </Link>
            </div>

            {/* ── Summary Cards ── */}
            {!loading && orders.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
                {[
                  { label: lang === 'FR' ? 'Total dépensé' : 'Total spent', value: formatAmount(totalSpent, 'XOF'), icon: '💸', color: '#FBBF24' },
                  { label: lang === 'FR' ? 'Transactions' : 'Transactions', value: totalPaid, icon: '✅', color: '#10B981' },
                  { label: lang === 'FR' ? 'Crédits achetés' : 'Credits bought', value: totalCredits || '—', icon: '💎', color: '#6C63FF' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '16px 12px',
                    border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 600, marginTop: 3, letterSpacing: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Content ── */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 76, borderRadius: 18, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
                <style dangerouslySetInnerHTML={{ __html: `@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}` }} />
              </div>
            ) : orders.length === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 24,
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(108,99,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, margin: '0 auto 20px'
                }}>🧾</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
                  {lang === 'FR' ? 'Aucune transaction' : 'No transactions yet'}
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '0 0 28px', lineHeight: 1.6 }}>
                  {lang === 'FR' ? 'Vos achats de crédits apparaîtront ici.' : 'Your credit purchases will appear here.'}
                </p>
                <Link href="/pricing" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #6C63FF, #a855f7)', color: '#fff',
                  padding: '14px 28px', borderRadius: 40, fontSize: 14, fontWeight: 700,
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(108,99,255,0.35)'
                }}>
                  {lang === 'FR' ? 'Acheter mon premier pack' : 'Buy my first pack'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            ) : (
              /* Transaction List grouped by date */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 }}>
                      {date}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map((order) => {
                        const cfg = getStatusConfig(order.status)
                        return (
                          <div key={order.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 18, padding: '14px 18px', gap: 16, flexWrap: 'wrap'
                          }}>
                            {/* Left */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                              <div style={{
                                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                                background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                              }}>
                                💳
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                                  {lang === 'FR' ? 'Recharge de crédits' : 'Credits top-up'}
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                                  {formatTime(order.created_at)} · Réf. {(order.payment_ref || order.id).slice(0, 10)}…
                                </div>
                              </div>
                            </div>

                            {/* Right */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>
                                  {formatAmount(order.amount, order.currency)}
                                </div>
                                {order.credits_awarded && (
                                  <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 600 }}>
                                    +{order.credits_awarded} {lang === 'FR' ? 'crédits' : 'credits'}
                                  </div>
                                )}
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Spacer for mobile nav/player */}
            <div className="pb-player-safe h-0" />
          </div>
        </main>
      </div>
    </>
  )
}