'use strict';

const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const AltTab = imports.ui.altTab;
const Main = imports.ui.main;
const WindowManager = imports.ui.windowManager;
const WorkspaceAnimation = imports.ui.workspaceAnimation;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;

class Extension {
    constructor() {
        this._wasScrollEvent = false;
    }

    enable() {
        this._overrideActionMoveWorkspace();
        this._overrideHandleWorkspaceScroll();
        this._overrideActivate();
    }

    disable() {
        WindowManager.WindowManager.prototype.actionMoveWorkspace =
            this._actionMoveWorkspaceOriginal;
        WindowManager.WindowManager.prototype.handleWorkspaceScroll =
            this._handleWorkspaceScrollOriginal;
        Meta.Workspace.prototype.activate = this._activateOriginal;
    }

    _overrideActionMoveWorkspace() {
        // Override `actionMoveWorkspace` instead of connecting to the `workspace-switched` signal,
        // so we see switch-to-workspace-n invocations even when workspace n is already active.
        this._actionMoveWorkspaceOriginal =
            WindowManager.WindowManager.prototype.actionMoveWorkspace;
        const self = this;
        WindowManager.WindowManager.prototype.actionMoveWorkspace = function (workspace) {
            self._actionMoveWorkspaceOriginal.apply(this, arguments);
            if (!self._wasScrollEvent) {
                self._focusPrimaryMonitor();
            }
            self._wasScrollEvent = false; // reset
        };
    }

    _overrideHandleWorkspaceScroll() {
        // Check, whether `handleWorkspaceScroll` was called before `actionMoveWorkspace`, so we
        // don't move the pointer (and focus) when the workspace switch was caused by a scroll
        // event.
        this._handleWorkspaceScrollOriginal =
            WindowManager.WindowManager.prototype.handleWorkspaceScroll;
        const self = this;
        WindowManager.WindowManager.prototype.handleWorkspaceScroll = function (event) {
            self._wasScrollEvent = true;
            self._handleWorkspaceScrollOriginal.apply(this, arguments);
        };
    }

    _overrideActivate() {
        this._activateOriginal = Meta.Workspace.prototype.activate;
        const self = this;
        Meta.Workspace.prototype.activate = function () {
            // We cannot reliably override `_switchWorkspaceEnd`, so we override `activate` and
            // check if it was invoked by `_switchWorkspaceEnd`. Since the three-finger gesture only
            // works when on the primary monitor (when workspaces don't span monitors), we can
            // assume that the primary monitor has the pointer.
            if (self._causedBySwipeGesture()) {
                self._focusPrimaryMonitorWhenHasPointer(this);
            }
            self._activateOriginal.apply(this, arguments);
        };
    }

    /**
     * Return true if the current call to `Workspace.activate` was invoked by a three-finger swipe
     * gesture to switch workspaces.
     */
    _causedBySwipeGesture() {
        const stack = new Error().stack;
        return stack
            .split('\n')
            .some((line) =>
                line.startsWith(
                    '_switchWorkspaceEnd/params.onComplete@resource:///org/gnome/shell/ui/workspaceAnimation.js',
                ),
            );
    }

    /** Focus the most recently focused window of the current workspace on the primary monitor. */
    _focusPrimaryMonitor() {
        // `AltTab.getWindows` might return windows of the current monitor only. We move the pointer
        // to the primary monitor to make it the current one.
        this._movePointerToPrimaryMonitor();
        // Wait a tick for the current monitor to be updated reliably.
        Mainloop.timeout_add(0, () => {
            const activeWs = global.workspaceManager.get_active_workspace();
            this._focusPrimaryMonitorWhenHasPointer(activeWs);
        });
    }

    /**
     * Focus the most recently focused window of the current workspace on the primary monitor.
     *
     * Might not work when the cursor is not in the primary monitor.
     */
    _focusPrimaryMonitorWhenHasPointer(workspace) {
        const windows = AltTab.getWindows(workspace);
        const mostRecentWindowOnPrimaryMonitor = windows.find(
            (window) => window.get_monitor() === Main.layoutManager.primaryIndex,
        );
        if (mostRecentWindowOnPrimaryMonitor) {
            workspace.activate_with_focus(
                mostRecentWindowOnPrimaryMonitor,
                global.get_current_time(),
            );
        }
    }

    /** Move the pointer to the primary monitor if it is not already there. */
    _movePointerToPrimaryMonitor() {
        if (global.display.get_current_monitor() !== Main.layoutManager.primaryIndex) {
            const seat = Clutter.get_default_backend().get_default_seat();
            const rect = global.display.get_monitor_geometry(Main.layoutManager.primaryIndex);
            seat.warp_pointer(rect.x + rect.width / 2, rect.y + rect.height / 2);
        }
    }
}

function init() {
    return new Extension();
}
