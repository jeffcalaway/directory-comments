module.exports =

    activate: (state) ->
        atom.commands.add 'atom-workspace',
            'docblock:new-line': ->
                editor = atom.workspace.getActiveTextEditor()
                editor.insertText("\n*  ")