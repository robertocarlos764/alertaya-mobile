import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class PressableScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double scale;
  final Duration duration;
  final Curve curve;
  final bool enabled;
  final bool haptic;

  const PressableScale({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.scale = 0.95,
    this.duration = const Duration(milliseconds: 130),
    this.curve = Curves.easeOut,
    this.enabled = true,
    this.haptic = false,
  });

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late Animation<double> _animation;

  void _recreateAnimation() {
    _animation = Tween<double>(begin: 1, end: widget.scale).animate(
      CurvedAnimation(
        parent: _controller,
        curve: widget.curve,
        reverseCurve: Curves.easeOutBack,
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
      reverseDuration: widget.duration,
    );
    _recreateAnimation();
  }

  @override
  void didUpdateWidget(covariant PressableScale oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.scale != oldWidget.scale ||
        widget.duration != oldWidget.duration ||
        widget.curve != oldWidget.curve) {
      _recreateAnimation();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _setPressed(bool pressed) {
    if (widget.enabled) {
      pressed ? _controller.forward() : _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: widget.enabled
          ? (_) {
              if (widget.haptic) HapticFeedback.mediumImpact();
              _setPressed(true);
            }
          : null,
      onTapUp: widget.enabled ? (_) => _setPressed(false) : null,
      onTapCancel: widget.enabled ? () => _setPressed(false) : null,
      onLongPress: widget.enabled ? widget.onLongPress : null,
      onLongPressStart: widget.enabled
          ? (_) {
              if (widget.haptic) HapticFeedback.heavyImpact();
              _setPressed(true);
            }
          : null,
      onLongPressEnd: widget.enabled ? (_) => _setPressed(false) : null,
      onLongPressUp: widget.enabled ? () => _setPressed(false) : null,
      onLongPressCancel: widget.enabled ? () => _setPressed(false) : null,
      onTap: widget.enabled ? widget.onTap : null,
      child: ScaleTransition(scale: _animation, child: widget.child),
    );
  }
}