'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'feedback'|'bug'|'feature'>('feedback');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const gotoPortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setLoadingPortal(false);
    }
  };

  const startCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setLoadingCheckout(false);
    }
  };

  const submitFeedback = async () => {
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, message: feedback }),
      });
      if (res.ok) setFeedback('');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('This will permanently delete your account and data. Are you sure?')) return;
    setDeleting(true);
    try {
      await fetch('/api/account/delete', { method: 'POST' });
      window.location.href = '/';
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>Manage your plan and payment methods via Stripe</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={startCheckout} disabled={loadingCheckout}>Upgrade to Premium</Button>
          <Button variant="outline" onClick={gotoPortal} disabled={loadingPortal}>Manage Billing</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback / Bug report</CardTitle>
          <CardDescription>Help us improve the product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Type</label>
            <select className="border rounded px-2 py-1" value={feedbackType} onChange={(e) => setFeedbackType(e.target.value as any)}>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature request</option>
            </select>
          </div>
          <Textarea placeholder="Your message" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <Button onClick={submitFeedback} disabled={submittingFeedback || !feedback.trim()}>Submit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}

