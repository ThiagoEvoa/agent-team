# Flutter feature example

Read when a new Flutter feature needs a concrete construction/reference pattern and the project has no suitable example. Prefer existing project code otherwise. This small example shows an immutable model, concrete repository, ViewModel, view, composition, and behavioral checks without generators or third-party state packages. Adapt the pattern to the project's Riverpod/Bloc/router conventions; it is not a replacement architecture or a requirement to add a layer per class.

The sample product intentionally stores tasks only in application memory. `TodoRepository` is its real storage implementation, not a fake substituting for a database. For a product requiring persistence, retain its real repository/storage and exercise the appropriate isolated engine in tests, following [testing guidance](testing.md). Error text and titles below are illustrative; use the app's localization and design tokens in production.

## Model, repository, and ViewModel (`todos.dart`)

```dart
import 'package:flutter/foundation.dart';

class Todo {
  const Todo({required this.id, required this.title});

  final int id;
  final String title;
}

class TodoRepository {
  final List<Todo> _items = [];
  int _nextId = 1;

  List<Todo> get all => List.unmodifiable(_items);

  void add(String input) {
    final title = input.trim();
    if (title.isEmpty) throw ArgumentError('A title is required');
    _items.add(Todo(id: _nextId++, title: title));
  }
}

class TodosViewModel extends ChangeNotifier {
  TodosViewModel(this._repository);

  final TodoRepository _repository;
  String? _error;

  List<Todo> get todos => _repository.all;
  String? get error => _error;

  bool add(String title) {
    try {
      _repository.add(title);
      _error = null;
      notifyListeners();
      return true;
    } on ArgumentError {
      _error = 'Enter a task title';
      notifyListeners();
      return false;
    }
  }
}
```

Validation belongs to the owning operation, so a caller cannot bypass it by omitting UI validation. The ViewModel maps the expected rejection into presentation state. It does not catch every infrastructure/programming exception as an invalid title.

## View (`todo_page.dart`)

```dart
import 'package:flutter/material.dart';
import 'todos.dart';

class TodoPage extends StatefulWidget {
  const TodoPage({super.key, required this.model});

  final TodosViewModel model;

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  final _title = TextEditingController();

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: widget.model,
        builder: (context, child) {
          final model = widget.model;
          return Scaffold(
            appBar: AppBar(title: const Text('Tasks')),
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  TextField(
                    key: const Key('task-title'),
                    controller: _title,
                    decoration: InputDecoration(
                      labelText: 'Task title',
                      errorText: model.error,
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (model.add(_title.text)) _title.clear();
                    },
                    child: const Text('Add task'),
                  ),
                  Expanded(
                    child: model.todos.isEmpty
                        ? const Center(child: Text('No tasks yet'))
                        : ListView(
                            children: [
                              for (final todo in model.todos)
                                ListTile(
                                  key: ValueKey(todo.id),
                                  title: Text(todo.title),
                                ),
                            ],
                          ),
                  ),
                ],
              ),
            ),
          );
        },
      );
}
```

## Composition, routing, and generation

The application/route owner constructs `TodosViewModel(TodoRepository())`, passes it to `TodoPage`, and disposes it when that ownership scope ends. The page owns only its text controller. Do not construct a new repository or ViewModel inside `build`; do not dispose an injected object owned by another component. In a workspace, expose the feature's required public types or route builder through its public library and declare direct package dependencies.

For an existing Riverpod/Bloc setup, use its provider/container and lifetime rules for the same real dependency assembly and state ownership. For asynchronous storage, model loading/error/data, disposal, cancellation, stale results, and repeated actions explicitly; the synchronous example does not establish those contracts.

If GoRouter is selected, export the feature route and compose it in the application shell, preserving existing redirects, deep links, and navigation behavior. Use the installed version's route APIs rather than copying a fixed scaffold. When Freezed/JSON, Riverpod, or Retrofit generators are adopted, keep source/part declarations and runtime/generator dependencies compatible, use the project's generation command, and inspect generated diffs. This example needs no code generation. See [workspace guidance](flutter-workspace.md) for package and generator boundaries.

## Behavioral checks (`todos_test.dart`)

The snippets below use real repository, ViewModel, and widget instances. Place the test under the feature's `test/` directory and adjust imports to its public library in a package/workspace.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../lib/todo_page.dart';
import '../lib/todos.dart';

void main() {
  test('a rejected blank task leaves existing tasks unchanged', () {
    final model = TodosViewModel(TodoRepository());
    addTearDown(model.dispose);
    expect(model.add('Read'), isTrue);

    expect(model.add('   '), isFalse);

    expect(model.todos.map((todo) => todo.title), ['Read']);
    expect(model.error, 'Enter a task title');
  });

  testWidgets('adding a task replaces the empty state with its title',
      (tester) async {
    final model = TodosViewModel(TodoRepository());
    addTearDown(model.dispose);
    await tester.pumpWidget(MaterialApp(home: TodoPage(model: model)));
    expect(find.text('No tasks yet'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('task-title')), '  Read  ');
    await tester.tap(find.text('Add task'));
    await tester.pump();

    expect(find.text('Read'), findsOneWidget);
    expect(find.text('No tasks yet'), findsNothing);
    expect(model.todos.single.title, 'Read');
  });
}
```

Extend scenarios from actual acceptance criteria, including recovery after a rejected input and affected async/navigation behavior when applicable. Use [Flutter runtime QA](flutter-runtime-qa.md) for device interaction and runtime evidence beyond widget tests. Do not replace these outcome assertions with `verify()` or spy call checks.
