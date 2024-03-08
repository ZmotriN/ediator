interface EdiatorSettings {
	className?: string,
	separator?: string,
	value?: string,
	input?: string,
	styleWithCSS?: boolean,
	actions?: Array<string>
	onChange?: (content: string) => void,
}

interface EdiatorAction {
	icon: string,
	title: string,
	block?: string,
	button?: HTMLElement,
	result: () => boolean,
	state?: () => boolean
}

interface EdiatorActions {
	[key: string]: EdiatorAction
}

interface EdiatorClasses {
	[key: string]: string
}


class Ediator {

	private input: HTMLInputElement = null;
	private parent: HTMLElement = null;
	private content: HTMLElement = null;
	private settings: EdiatorSettings = {};

	private readonly classes: EdiatorClasses = {
		editor: 'ediator',
		content: 'ediator__content',
		actionbar: 'ediator__actionbar',
		button: 'ediator__actionbar__button',
		selected: 'ediator__actionbar__button--selected'
	};

	private readonly defaultSettings: EdiatorSettings = {
		className: '',
		separator: 'p',
		value: '',
		input: '',
		styleWithCSS: false,
		onChange: null,
		actions: [
			'bold',
			'underline',
			'italic',
			'superscript',
			'subscript'
		]
	};

	private readonly defaultActions: EdiatorActions = {
		bold: {
			icon: '<b>B</b>',
			title: 'Bold',
			state: (): boolean => { return this.queryState('bold'); },
			result: (): boolean => { return this.exec('bold'); }
		},
		italic: {
			icon: '<i>I</i>',
			title: 'Italic',
			state: (): boolean => { return this.queryState('italic'); },
			result: (): boolean => { return this.exec('italic'); }
		},
		underline: {
			icon: '<u>U</u>',
			title: 'Underline',
			state: (): boolean => { return this.queryState('underline'); },
			result: (): boolean => { return this.exec('underline'); }
		},
		superscript: {
			icon: '<sup>x</sup>',
			title: 'Superscript',
			state: (): boolean => { return this.queryState('superscript'); },
			result: (): boolean => { return this.exec('superscript'); }
		},
		subscript: {
			icon: '<sub>y</sub>',
			title: 'Subscript',
			state: (): boolean => { return this.queryState('subscript'); },
			result: (): boolean => { return this.exec('subscript'); }
		},
		strikethrough: {
			icon: '<strike>S</strike>',
			title: 'Strike-through',
			state: (): boolean => { return this.queryState('strikeThrough'); },
			result: (): boolean => { return this.exec('strikeThrough'); }
		},
		heading1: {
			icon: '<b>H<sub>1</sub></b>',
			title: 'Heading 1',
			block: 'h1',
			state: (): boolean => { return this.queryBlockState('h1'); },
			result: (): boolean => { return this.exec('formatBlock', '<h1>'); }
		},
		heading2: {
			icon: '<b>H<sub>2</sub></b>',
			title: 'Heading 2',
			state: (): boolean => { return this.queryBlockState('h2'); },
			result: (): boolean => { return this.exec('formatBlock', '<h2>'); }
		},
		paragraph: {
			icon: '&#182;',
			title: 'Paragraph',
			state: (): boolean => { return this.queryBlockState('p'); },
			result: (): boolean => { return this.exec('formatBlock', '<p>'); }
		},
		quote: {
			icon: '&#8220; &#8221;',
			title: 'Quote',
			state: (): boolean => { return this.queryBlockState('blockquote'); },
			result: (): boolean => { return this.exec('formatBlock', '<blockquote>'); }
		},
		code: {
			icon: '&lt;/&gt;',
			title: 'Code',
			state: (): boolean => { return this.queryBlockState('pre'); },
			result: (): boolean => { return this.exec('formatBlock', '<pre>'); }
		},
		olist: {
			icon: '&#35;',
			title: 'Ordered List',
			result: (): boolean => { return this.exec('insertOrderedList'); }
		},
		ulist: {
			icon: '&#8226;',
			title: 'Unordered List',
			result: (): boolean => { return this.exec('insertUnorderedList'); }
		},
		line: {
			icon: '&#8213;',
			title: 'Horizontal Line',
			result: (): boolean => { return this.exec('insertHorizontalRule'); }
		},
		link: {
			icon: '&#128279;',
			title: 'Link',
			result: (): boolean => {
				const url = window.prompt('Enter the link URL');
				if (url) this.exec('createLink', url);
				return true;
			}
		},
		image: {
			icon: '&#128247;',
			title: 'Image',
			result: (): boolean => {
				var url = window.prompt('Enter the image URL');
				if (url) this.exec('insertImage', url);
				return true;
			}
		}
	}

	public get value(): string {
		return this.content.innerHTML;
	}

	public set value(val: string) {
		this.content.innerHTML = val;
		this.content.focus();
		this.change();
	}


	constructor(parent: HTMLElement | string, settings: EdiatorSettings = {}) {
		this.parent = typeof parent == 'string' ? document.querySelector(parent) : parent;
		for (const k in this.defaultSettings) this.settings[k] = settings[k] ?? this.defaultSettings[k];

		const container = this.create('div', this.classes.editor);
		if (this.settings.className) container.classList.add(this.settings.className);

		const actionbar = this.create('div', this.classes.actionbar);
		actionbar.tabIndex = -1;
		container.append(actionbar);

		this.settings.actions.forEach((action) => {
			if (this.defaultActions[action] !== undefined) {
				const btn = this.create('button', this.classes.button);
				this.defaultActions[action].button = btn;
				btn.innerHTML = this.defaultActions[action].icon;
				btn.title = this.defaultActions[action].title;
				btn.tabIndex = -1;
				actionbar.append(btn);
				btn.addEventListener('click', () => {
					const result = this.defaultActions[action].result();
					this.checkStates();
					this.content.focus();
					return result;
				});
			}
		});

		this.content = this.create('div', this.classes.content);
		this.content.contentEditable = 'true';
		this.content.addEventListener('mousedown', () => { this.checkStates(); });
		this.content.addEventListener('input', (evt) => { this.change(); })
		this.exec('defaultParagraphSeparator', this.settings.separator);
		if (this.settings.styleWithCSS) this.exec('styleWithCSS');
		container.append(this.content);

		if(this.settings.input) {
			this.input = <HTMLInputElement>this.create('input');
			this.input.type = 'hidden';
			this.input.name = this.settings.input;
			container.append(this.input);
		}

		this.parent.append(container);
	}


	private change() {
		if(this.content.firstChild && this.content.firstChild.nodeType === Node.TEXT_NODE) this.exec('formatBlock', '<' + this.settings.separator + '>');
		else if (this.content.innerHTML === '<br>') this.content.innerHTML = '';
		if(this.settings.onChange) this.settings.onChange(this.content.innerHTML);
		if(this.input) this.input.value = this.content.innerHTML;
		this.checkStates();
	}


	private create(tag: string, classname: string = null): HTMLElement {
		const elm = document.createElement(tag);
		if (classname) elm.className = classname;
		return elm;
	}


	private exec(cmd: string, value: any = null): boolean {
		setTimeout(() => { document.execCommand(cmd, false, value); }, 0);
		return true;
	}


	private queryState(cmd: string): boolean {
		return document.queryCommandState(cmd);
	}


	private queryBlockState(block: string): boolean {
		return document.queryCommandValue('formatBlock').toLowerCase() == block.toLowerCase();
	}


	private checkStates(): void {
		setTimeout(() => {
			this.settings.actions.forEach((action) => {
				if (this.defaultActions[action] !== undefined && this.defaultActions[action].state !== undefined) {
					if (this.defaultActions[action].state()) {
						this.defaultActions[action].button.classList.add(this.classes.selected);
					} else {
						this.defaultActions[action].button.classList.remove(this.classes.selected);
					}
				}
			});
		}, 1);
	}
}
