import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';

class StaggeredFadeIn extends StatelessWidget {
  final List<Widget> children;
  final Duration interval;
  final Duration duration;
  final CrossAxisAlignment crossAxisAlignment;

  const StaggeredFadeIn({
    super.key,
    required this.children,
    this.interval = const Duration(milliseconds: 100),
    this.duration = const Duration(milliseconds: 500),
    this.crossAxisAlignment = CrossAxisAlignment.stretch,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: crossAxisAlignment,
      children: [
        for (var i = 0; i < children.length; i++)
          FadeInDown(
            key: ValueKey('staggered-$i'),
            delay: interval * i,
            duration: duration,
            child: children[i],
          ),
      ],
    );
  }
}