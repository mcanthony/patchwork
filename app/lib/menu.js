var Menu = require('menu')
var dialog = require('dialog')

module.exports = function (window) {
  var template = [
    {
      label: 'Patchwork',
      submenu: [
        {
          label: 'About Patchwork',
          selector: 'orderFrontStandardAboutPanel:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide Patchwork',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Option+Command+H',
          selector: 'hideOtherApplications:'
        },
        {
          label: 'Show All',
          selector: 'unhideAllApplications:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          selector: 'terminate:'
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'Command+O',
          click: function() { 
            var paths = dialog.showOpenDialog(window, { properties: ['openFile'] })
            if (paths && paths[0])
              window.rpc.navigate(paths[0])
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Command+Z',
          selector: 'undo:'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          selector: 'redo:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'Command+X',
          selector: 'cut:'
        },
        {
          label: 'Copy',
          accelerator: 'Command+C',
          selector: 'copy:'
        },
        {
          label: 'Paste',
          accelerator: 'Command+V',
          selector: 'paste:'
        },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Find',
          accelerator: 'Command+F',
          click: function () {
            window.rpc.triggerFind()
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: function() { 
            window.resetRpc()
            window.reload()
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Command+I',
          click: function() { 
            window.rpc.contextualToggleDevTools()
          }
        },
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        }
      ]
    },
    {
      label: 'Help',
      submenu: []
    }
  ]

  menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}