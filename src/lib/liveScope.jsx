import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const box = (extra = {}) => ({
  background: '#1a1d24',
  border: '1px solid #2e3138',
  borderRadius: 10,
  padding: 16,
  color: '#e8eaed',
  ...extra,
})

export const liveScope = {
  React,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Fragment: React.Fragment,
  Children: React.Children,

  Button: ({ children, className, ...props }) => (
    <button
      className={className}
      style={{
        background: '#534ab7',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 16px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
    </button>
  ),
  Card: ({ children, title, className }) => (
    <div className={className} style={box({ width: '100%' })}>
      {title && <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      {children}
    </div>
  ),
  Input: (props) => (
    <input
      style={{
        width: '100%',
        padding: '10px 12px',
        background: '#0d0f12',
        border: '1px solid #2e3138',
        borderRadius: 8,
        color: '#e8eaed',
      }}
      {...props}
    />
  ),
  Badge: ({ children }) => (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(127,119,221,0.2)',
        color: '#afa9ec',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  ),
  Icon: () => (
    <span
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #534ab7, #7f77dd)',
      }}
    />
  ),
  Container: ({ children }) => <div style={{ width: '100%' }}>{children}</div>,
  Stack: ({ children, gap = 12 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
  ),
  Row: ({ children, gap = 12 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>{children}</div>
  ),
  Text: ({ children, muted }) => (
    <p style={{ color: muted ? 'rgba(255,255,255,0.6)' : '#e8eaed', lineHeight: 1.5 }}>
      {children}
    </p>
  ),
  Heading: ({ children }) => (
    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{children}</h2>
  ),
}
