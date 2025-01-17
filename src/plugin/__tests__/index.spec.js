import plugin from "../";
import { transform } from "@babel/core";
import traverse from "@babel/traverse";

function runPlugin(input, opts = {}) {
  return transform(input, {
    filename: "jest tests fixture",
    compact: false,
    plugins: [plugin],
    ...opts,
  });
}

describe("babel plugin", () => {
  beforeAll(() => {
    process.env.REANIMATED_PLUGIN_TESTS = "jest";
  });

  it("transforms", () => {
    const input = `
      import Animated, {
        useAnimatedStyle,
        useSharedValue,
      } from 'react-native-reanimated';

      function Box() {
        const offset = useSharedValue(0);

        const animatedStyles = useAnimatedStyle(() => {
          return {
            transform: [{ translateX: offset.value * 255 }],
          };
        });

        return (
          <>
            <Animated.View style={[styles.box, animatedStyles]} />
            <Button onPress={() => (offset.value = Math.random())} title="Move" />
          </>
        );
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("doesn't transform functions without 'worklet' directive", () => {
    const input = `
      function f(x) {
        return x + 2;
      }
    `;

    const { code } = runPlugin(input);
    expect(code).not.toContain("_f.__workletHash");
  });

  it("removes comments from worklets", () => {
    const input = `
      const f = () => {
        'worklet';
        // some comment
        /*
        * other comment
        */
        return true;
      };
    `;

    const { code } = runPlugin(input);
    expect(code).not.toContain("some comment");
    expect(code).not.toContain("other comment");
  });

  it('removes "worklet"; directive from worklets', () => {
    const input = `
      function foo(x) {
        "worklet"; // prettier-ignore
        return x + 2;
      }
    `;

    const { code } = runPlugin(input);
    expect(code).not.toContain('\\"worklet\\";');
  });

  it("removes 'worklet'; directive from worklets", () => {
    const input = `
      function foo(x) {
        'worklet'; // prettier-ignore
        return x + 2;
      }
    `;

    const { code } = runPlugin(input);
    expect(code).not.toContain("'worklet';");
  });

  it("doesn't transform string literals", () => {
    const input = `
      function foo(x) {
        'worklet';
        const bar = 'worklet'; // prettier-ignore
        const baz = "worklet"; // prettier-ignore
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("captures worklets environment", () => {
    const input = `
      const x = 5;

      const objX = { x };

      function f() {
        'worklet';
        return { res: x + objX.x };
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("doesn't capture globals", () => {
    const input = `
      function f() {
        'worklet';
        console.log('test');
      }
    `;

    const { code, ast } = runPlugin(input, { ast: true });
    let closureBindings;
    traverse(ast, {
      enter(path) {
        if (
          path.isAssignmentExpression() &&
          path.node.left.property.name === "_closure"
        ) {
          closureBindings = path.node.right.properties;
        }
      },
    });
    expect(closureBindings).toEqual([]);
    expect(code).toMatchSnapshot();
  });

  // functions

  it("workletizes FunctionDeclaration", () => {
    const input = `
      function foo(x) {
        'worklet';
        return x + 2;
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  it("workletizes ArrowFunctionExpression", () => {
    const input = `
      const foo = (x) => {
        'worklet';
        return x + 2;
      };
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  it("workletizes unnamed FunctionExpression", () => {
    const input = `
      const foo = function (x) {
        'worklet';
        return x + 2;
      };
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  it("workletizes named FunctionExpression", () => {
    const input = `
      const foo = function foo(x) {
        'worklet';
        return x + 2;
      };
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  // class methods

  it("workletizes instance method", () => {
    const input = `
      class Foo {
        bar(x) {
          'worklet';
          return x + 2;
        }
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  it("workletizes static method", () => {
    const input = `
      class Foo {
        static bar(x) {
          'worklet';
          return x + 2;
        }
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  it("workletizes getter", () => {
    const input = `
      class Foo {
        get bar() {
          'worklet';
          return x + 2;
        }
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toContain("_f.__workletHash");
    expect(code).not.toContain('\\"worklet\\";');
    expect(code).toMatchSnapshot();
  });

  it("doesn't transform standard callback functions", () => {
    const input = `
      const foo = Something.Tap().onEnd((_event, _success) => {
        console.log('onEnd');
      });
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("transforms spread operator in worklets for arrays", () => {
    const input = `
      function foo() {
        'worklet';
        const bar = [4, 5];
        const baz = [1, ...[2, 3], ...bar];
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("transforms spread operator in worklets for objects", () => {
    const input = `
      function foo() {
        'worklet';
        const bar = {d: 4, e: 5};
        const baz = { a: 1, ...{ b: 2, c: 3 }, ...bar };
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("transforms spread operator in worklets for function arguments", () => {
    const input = `
      function foo(...args) {
        'worklet';
        console.log(args);
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("transforms spread operator in worklets for function calls", () => {
    const input = `
      function foo(arg) {
        'worklet';
        console.log(...arg);
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("supports recursive calls", () => {
    const input = `
      const a = 1;
      function foo(t) {
        'worklet';
        if (t > 0) {
          return a + foo(t-1);
        }
      }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("supports SequenceExpression", () => {
    const input = `
    function App(){
      (0, fun)({ onStart() {} }, []);
    }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("supports SequenceExpression, with worklet", () => {
    const input = `
    function App(){
      (0, fun)({ onStart() {'worklet'} }, []);
    }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("supports SequenceExpression, many arguments", () => {
    const input = `
    function App(){
      (0, 3, fun)({ onStart() {'worklet'} }, []);
    }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });

  it("supports SequenceExpression, with worklet closure", () => {
    const input = `
    function App(){
      const obj = {a: 1, b: 2};
      (0, fun)({ onStart() {'worklet'; const a = obj.a;} }, []);
    }
    `;

    const { code } = runPlugin(input);
    expect(code).toMatchSnapshot();
  });
});
