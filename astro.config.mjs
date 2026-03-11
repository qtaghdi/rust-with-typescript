// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';
import { runnableCodePlugin } from './src/expressive-code/runnable-plugin.mjs';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	adapter: cloudflare({ imageService: 'compile' }),
	integrations: [
		starlight({
			title: 'Rust with TypeScript',
			description: 'TypeScript 개발자를 위한 실전 Rust 가이드',
			logo: {
				light: './src/assets/logo-light.svg',
				dark:  './src/assets/logo-dark.svg',
				replacesTitle: false,
			},
			customCss: ['./src/styles/custom.css'],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.googleapis.com',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.gstatic.com',
						crossorigin: true,
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
					},
				},
				{
					tag: 'script',
					attrs: {
						type: 'module',
						src: '/runnable-code.js',
					},
				},
			],
			expressiveCode: {
				themes: ['one-dark-pro', 'github-light'],
				styleOverrides: {
					borderRadius: '8px',
					codeFontFamily: "'JetBrains Mono', 'Fira Code', monospace",
					codeFontSize: '0.88em',
				},
				plugins: [runnableCodePlugin()],
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/qtaghdi/rust-with-typescript',
				},
			],
			sidebar: [
				{
					label: '시작하기',
					items: [
						{ label: 'Ch.1 — 들어가며',  slug: 'ch0-intro' },
						{ label: 'Ch.2 — 멘탈 모델', slug: 'ch1-mental-model' },
					],
				},
				{
					label: '핵심 언어',
					items: [
						{ label: 'Ch.3 — 문법 기초',              slug: 'ch2-syntax' },
						{ label: 'Ch.4 — Ownership & Borrowing',  slug: 'ch3-ownership' },
						{ label: 'Ch.5 — Cargo & 모듈 시스템',    slug: 'ch10-cargo' },
					],
				},
				{
					label: '타입 시스템',
					items: [
						{ label: 'Ch.6 — Enum & 패턴 매칭',    slug: 'ch6-enums' },
						{ label: 'Ch.7 — 컬렉션',              slug: 'ch7-collections' },
						{ label: 'Ch.8 — 이터레이터 & 클로저', slug: 'ch8-iterators' },
						{ label: 'Ch.9 — Trait 심화',           slug: 'ch9-traits' },
						{ label: 'Ch.10 — 스마트 포인터',       slug: 'ch12-smart-pointers' },
						{ label: 'Ch.11 — 동시성',              slug: 'ch13-concurrency' },
					],
				},
				{
					label: '실전 응용',
					items: [
						{ label: 'Ch.12 — 실전 예제',   slug: 'ch4-practical' },
						{ label: 'Ch.13 — 테스트',      slug: 'ch11-testing' },
						{ label: 'Ch.14 — 학습 로드맵', slug: 'ch5-roadmap' },
					],
				},
				{
					label: '레퍼런스',
					items: [
						{ label: '용어 사전', slug: 'glossary' },
					],
				},
			],
		}),
	],
});
