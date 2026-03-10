// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { runnableCodePlugin } from './src/expressive-code/runnable-plugin.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Rust with TypeScript',
			description: 'TypeScript 개발자를 위한 실전 Rust 가이드',
			logo: {
				light: './src/assets/logo-light.svg',
				dark:  './src/assets/logo-dark.svg',
				replacesTitle: true,
			},
			customCss: ['./src/styles/custom.css'],
			head: [
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
					label: '이론 — 문법 & 타입',
					items: [
						{ label: 'Ch.3 — 문법 기초',        slug: 'ch2-syntax' },
						{ label: 'Ch.4 — Enum & 패턴 매칭', slug: 'ch6-enums' },
						{ label: 'Ch.5 — 컬렉션',           slug: 'ch7-collections' },
						{ label: 'Ch.6 — Trait 심화',       slug: 'ch9-traits' },
					],
				},
				{
					label: '이론 — 메모리 & 안전성',
					items: [
						{ label: 'Ch.7 — Ownership & Borrowing', slug: 'ch3-ownership' },
						{ label: 'Ch.8 — 이터레이터 & 클로저',   slug: 'ch8-iterators' },
					],
				},
				{
					label: '실전',
					items: [
						{ label: 'Ch.9 — 실전 예제',    slug: 'ch4-practical' },
						{ label: 'Ch.10 — 학습 로드맵', slug: 'ch5-roadmap' },
					],
				},
			],
		}),
	],
});
