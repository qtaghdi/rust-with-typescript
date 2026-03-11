// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';
import { runnableCodePlugin } from './src/expressive-code/runnable-plugin.mjs';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: cloudflare({ imageService: 'compile' }),
	integrations: [
		starlight({
			title: 'Rust with TypeScript',
			description: 'A practical Rust guide for TypeScript developers',
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				ko:   { label: '한국어',   lang: 'ko' },
			},
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
					label: 'Getting Started',
					translations: { ko: '시작하기' },
					items: [
						{ label: 'Ch.1 — Introduction',  translations: { ko: 'Ch.1 — 들어가며' },  slug: 'ch0-intro' },
						{ label: 'Ch.2 — Mental Model',  translations: { ko: 'Ch.2 — 멘탈 모델' }, slug: 'ch1-mental-model' },
					],
				},
				{
					label: 'Core Language',
					translations: { ko: '핵심 언어' },
					items: [
						{ label: 'Ch.3 — Syntax Basics',       translations: { ko: 'Ch.3 — 문법 기초' },           slug: 'ch2-syntax' },
						{ label: 'Ch.4 — Ownership & Borrowing', translations: { ko: 'Ch.4 — Ownership & Borrowing' }, slug: 'ch3-ownership' },
						{ label: 'Ch.5 — Cargo & Modules',     translations: { ko: 'Ch.5 — Cargo & 모듈 시스템' },  slug: 'ch10-cargo' },
					],
				},
				{
					label: 'Type System',
					translations: { ko: '타입 시스템' },
					items: [
						{ label: 'Ch.6 — Enums & Pattern Matching', translations: { ko: 'Ch.6 — Enum & 패턴 매칭' },    slug: 'ch6-enums' },
						{ label: 'Ch.7 — Collections',              translations: { ko: 'Ch.7 — 컬렉션' },              slug: 'ch7-collections' },
						{ label: 'Ch.8 — Iterators & Closures',     translations: { ko: 'Ch.8 — 이터레이터 & 클로저' }, slug: 'ch8-iterators' },
						{ label: 'Ch.9 — Traits in Depth',          translations: { ko: 'Ch.9 — Trait 심화' },          slug: 'ch9-traits' },
						{ label: 'Ch.10 — Smart Pointers',          translations: { ko: 'Ch.10 — 스마트 포인터' },      slug: 'ch12-smart-pointers' },
						{ label: 'Ch.11 — Concurrency',             translations: { ko: 'Ch.11 — 동시성' },             slug: 'ch13-concurrency' },
					],
				},
				{
					label: 'Practical',
					translations: { ko: '실전 응용' },
					items: [
						{ label: 'Ch.12 — Practical Examples', translations: { ko: 'Ch.12 — 실전 예제' },   slug: 'ch4-practical' },
						{ label: 'Ch.13 — Testing',            translations: { ko: 'Ch.13 — 테스트' },      slug: 'ch11-testing' },
						{ label: 'Ch.14 — Learning Roadmap',   translations: { ko: 'Ch.14 — 학습 로드맵' }, slug: 'ch5-roadmap' },
					],
				},
				{
					label: 'Reference',
					translations: { ko: '레퍼런스' },
					items: [
						{ label: 'Glossary', translations: { ko: '용어 사전' }, slug: 'glossary' },
					],
				},
			],
		}),
	],
});
