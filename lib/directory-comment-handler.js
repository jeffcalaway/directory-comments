'use babel';

//░░░░░░░░░░░░░░░░░░░░░░░░
//
//     DIRECTORY
//
//    _Constructor
//    _Editor
//      ∟SaveEditor
//      ∟ClickEditor
//      ∟MoveEditor
//    _Buffer
//      ∟ProcessBuffer
//      ∟UpdateBuffer
//    _Line
//      ∟ProcessLine
//      ∟AddLine
//    _Dispose
//
//░░░░░░░░░░░░░░░░░░░░░░░░

import { CompositeDisposable, Disposable, Range, Point } from 'atom';

class DirectoryCommentHandler {

	subscriptions = null;
	editor        = null;
	buffer        = null;
	text          = null;
	sections      = null;
	directory     = null;
	indentation   = null;

	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	// _Constructor
	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	constructor(editor){
		this.subscriptions = new CompositeDisposable();
		this.editor        = editor;
		this.buffer        = editor.getBuffer();

		this.subscriptions.add(this.buffer.onWillSave(
			() => this.saveEditor()
		));

		this.subscriptions.add(this.editor.onDidTokenize(
			() => this.processBuffer()
		));

		this.subscriptions.add(this.editor.onDidChangeSelectionRange(
			(event) => this.clickEditor(event)
		));
	}


	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	// _Editor
	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟SaveEditor
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	saveEditor(){
		this.processBuffer();
		this.updateBuffer();
		this.processBuffer();
	}

	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟ClickEditor
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	clickEditor(event){
		if ( event.selection.isEmpty() || !event.selection.isSingleScreenLine() ) return;

		if ( !this.directory ) return;

		let row = event.newBufferRange.start.row;

		if ( !this.editor.isBufferRowCommented(row) ) return;

		let range = new Range(this.directory[0], this.directory[1]);

		if ( !range.containsRange(event.newBufferRange) ) return;

		let offset  = this.directory[0].row
		let index   = row - offset;
		let section = this.sections[index];

		if ( !section || section.type+section.name != event.selection.getText() ) return;

		this.moveEditor(section.point);
	}

	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟MoveEditor
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	moveEditor(point){
		this.editor.unfoldBufferRow(point.row);
		this.editor.setSelectedBufferRange([point, [point.row, Infinity]]);
		this.editor.scrollToCursorPosition({ center: true });
	}


	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	// _Buffer
	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟ProcessBuffer
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	processBuffer(){
		if (this.editor.getPath() === atom.config.getUserConfigPath()) return;

		this.sections  = [];
		this.directory = [];

		this.buffer.transact(() => {
			for (let row = 0, lineCount = this.buffer.getLineCount(); row < lineCount; ++row) {
				let line = this.buffer.lineForRow(row)

				this.processLine(line, row);
			}
		});
	}

	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟UpdateBuffer
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	updateBuffer(){
		if( !this.sections.length || !this.directory.length === 2 ) return;

		this.text = [];

		for (var i = 0; i < this.sections.length; i++) {
			let section = this.sections[i];

			let type    = section.type == '_' ? '    _' : '      ∟';
			let name    = section.name;
			let comment = section.comment;

			this.addLine(comment+type+name);
		}

		this.buffer.setTextInRange(this.directory, this.text.join('\r\n'));
	}


	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	// _Line
	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟ProcessLine
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	processLine(line, bufferRow){
		if ( !this.editor.isBufferRowCommented(bufferRow) ) return;

		let cursor  = new Point(bufferRow, 0);
		let comment = atom.config.get('editor.commentStart', { scope: this.editor.scopeDescriptorForBufferPosition(cursor).scopes }).trim();

		if ( comment.length == 1 ) {
			comment = comment + comment;
		}

		let dpattern  = new RegExp('^(\\s*)'+comment+'░+');
		let directory = line.match(dpattern);

		if( directory && this.directory.length < 2 ){
			let row    = this.directory.length ? bufferRow - 2 : bufferRow + 4;
			let column = this.directory.length ? Infinity : 0;
			let point  = new Point(row, column);

			this.directory.push(point);
			this.indentation = directory[1];
		}

		if( this.directory.length !== 2 ) return;

		let spattern = new RegExp('^(\\s*)'+comment+'\\s*(_|∟)(.*)$');
		let section  = line.match(spattern);

		if( section ){
			let type   = section[2];
			let name   = section[3];
			let row    = bufferRow;
			let column = line.search(/(_|∟)/);
			let point  = new Point(row, column);

			this.sections.push({
				type,
				name,
				comment,
				point,
			});
		}
	}

	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	// ∟AddLine
	//∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴∵∴
	addLine(text){
		this.text.push(this.indentation+text);
	}


	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	// _Dispose
	//≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
	dispose(){
		this.subscriptions.dispose();
	}
}

export { DirectoryCommentHandler };