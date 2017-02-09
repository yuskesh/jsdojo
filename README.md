# Node and Test

## Nodeとエラーハンドリング

Node.jsを利用したプログラムでのエラーハンドリングについて。

* Try-Catch
* コールバックでのエラー処理
* Errorオブジェクトの拡張
* Errorイベント
* uncaughtException、またはDomainを使ったエラーハンドリング

### try-catch

JavaScript では発生した例外の補足に try-catch 文を利用できますね。

    try {
        functionThrowsException();
    } catch (error) {
        console.log(error)
    }

ただし、この `functionThrowsException()` という関数は非同期関数ではない必要があります。

非同期関数の場合、例外が発生してもそれを補足することはできません。 Node.js ではこの非同期関数を利用することがおおいため、`try-catch`は万能ではないことに留意しておいてください。

例：asyncTryCatch.js

    function asyncFunc() {
      setTimeout(function(){
        throw new Error('error!');
      },1);
    }
    
    function asyncTryCatch() {
      try {
        asyncFunc();
      } catch (error) {
        console.log('Caught: ' + error); // can't handle the thrown error.
      }
    }
    
    asyncTryCatch();

この例では`catch`で例外を補足しきれず、プログラムがエラー終了してしまいます。

Node.js で try-catch を利用する局面ですが、主にはJSONデータをパースする時、もしくは例外を throw するモジュールを扱うといった場合が多いです。先ほども書いたように非同期関数での取り扱いが難しいうえ、性能面でも不利となるので try-catch を利用するのは最小限にとどめておくのが望ましいでしょう。

### コールバックでのエラー処理

Node.jsのプログラム中ではコールバック関数が多用されます。ベストプラクティスとして、コールバックの第一引数に常にエラーを取るようにするというものがあります。いやむしろ第一引数にエラーを取るように設定していないコールバックを書くのは避けましょう。後ほど説明しますがそうすることで幸せになれます。

    function callback(err, result) {
      if(err) {
          // handle the error here
          console.error(err);
          return;
      }
      // handle result here
      console.log(result);
    }
    
    function hello(arg, cb){
      if(arg == 1){
        cb(new Error('error here'));
        return;
      }
      console.log('arg is: '+arg);
    }
    
    hello(1, callback);
    hello(2, callback);

ここでは単純に、是が非でもコールバックの第一引数は_エラー_と覚えておいてください。


### Errorオブジェクトの拡張

JavaScriptにErrorオブジェクトがあるのはご存知の通り。
このErrorオブジェクトの派生としていくつかのオブジェクトが存在します。`TypeError`, `RangeError`, `SyntaxError`, `ReferenceError`, `URIError`, `EvalError`といったErrorです。
Nodeを使っているとこの中でも、`TypeError`や`ReferenceError`を見ることが多いのではないでしょうか。Node.jsを利用して何度もこれらのエラーが発生しているのを見るうちに、だいたい原因が何か、つかめるようになってきます。
例えば `TypeError` は関数へ渡されるプロパティが `Undefined` であるときに、そのプロパティを参照しようとして発生していることが多いですね。

Errorオブジェクトはシステムによる上記のエラーオブジェクトの生成の他に、もちろん`new`によって生成する事が可能です。
致命的な不整合が起きた場合などに、

    throw new Error("A fatal error ocurred");

などとして例外を投げる場合も多々あります。また、コールバックへの第一引数にErrorオブジェクトを渡す場合ももちろんあります。その場合に呼び出し元でエラーハンドリングを行うわけですが、エラーオブジェクトの種別を個別にしておくことでエラー発生時にエラーの種類に応じて処理を分岐する事が可能となります。

そのようなケースを考えてみましょう。ログインの必要なアプリケーションにおいては認証ロジックが組み込まれていますが、単純にIDやパスワードが間違っており、認証が失敗するパターン。もしくは認証情報が含まれているストレージへの接続ができないパターンなどがあります。

ここでは先ほどのパターンのエラーをそれぞれ、AuthenticationErrorとStorageErrorとして定義してみます。

まずはAuthenticationErrorクラスを定義してみましょう。こんな感じかな？

// AuthenticationError

    var util = require('util');
    
    function AuthenticationError(msg) {
        Error.call(this); // 
        this.message = msg || 'Authentication Error';
        this.name = 'AuthenticationError';
    }
    
    util.inherits(AuthenticationError, Error);
    
    module.exports = AuthenticationError;

次に実際にエラークラスからインスタンスを生成してエラーハンドリングしてみます。

    var util = require('util');
    var AuthenticationError = require('./AuthenticationError');

    try {
      var ae = new AuthenticationError('ID or Password is wrong');
      throw ae;
    } catch (e) {
      if(e.name && e.name === 'AuthenticationError') {
      // if(e instanceof AuthenticationError) // こちらでもよい
        console.error('AuthenticaitonError ocurred');
      }
    }

出力は以下の通り。

    AuthenticaitonError ocurred

ただ、これだけだとどこでエラーが発生したのか解らないのでスタックトレースを表示させてみましょう。
そのために、`Error`クラスの`captureStackTrace()`をカスタムエラークラスのコンストラクタに仕込みます。この関数を呼ぶと`stack`プロパティにスタックトレースが保存されます。スタックトレースのサイズですが、これはデフォルトで10フレームのみなので、このサイズを調整したい場合は `Error.stackTraceLimit` に適当な値をセットしてください。

この辺について詳しくは [V8 JavaScriptStackTraceAPI](https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi) を参照のこと。

では実際のエラークラスについてですが、以下のようになります。

    var util = require('util');
    
    function AuthenticationError(msg) {
        Error.call(this); // execute Error constructor
        this.message = msg || 'Authentication Error';
        this.name = 'AuthenticationError';
        Error.captureStackTrace(this, AuthenticationError);
    }
    
    util.inherits(AuthenticationError, Error);
    
    module.exports = AuthenticationError;

これでエラーハンドリングする側からは`stack`プロパティを扱えるようになります。

    var util = require('util');
    var AuthenticationError = require('./AuthenticationError');

    try {
      var ae = new AuthenticationError('ID or Password is wrong');
      throw ae;
    } catch (e) {
      if(e.name && e.name === 'AuthenticationError') {
        console.error('AuthenticaitonError ocurred');
        console.error(e.stack);
      }
    }

ではコールバックのケースを模してみると

    var util = require('util');
    var AuthenticationError = require('./AuthenticationError');
    
    var ae = new AuthenticationError('ID or Password is wrong');
    
    function callback(err, result) {
      if(err && err instanceof AuthenticationError){
        console.error('AuthenticaitonError ocurred');
        console.log(err.stack);
        return err;
      }
      
      // handling result
    }
    
    callback(ae);

さて、`AuthenticationError`クラスが出来たので`StorageError`クラスも作ってみましょう。エラーに属性を付けて、クリティカルなエラーを判別し、発生した場合は管理者にメールするなどできるようなものにしてみます。

// StorageError.js

    var util = require('util');
    
    function StorageError(msg) {
        Error.call(this); // execute Error constructor
        this.message = msg || 'Storage Error';
        this.name = 'StorageError';
        this.type = 'critical';
        Error.captureStackTrace(this, StorageError);
    }
    
    util.inherits(StorageError, Error);
    
    module.exports = StorageError;

// testErrorHandler.js

    var util = require('util');
    var StorageError = require('./StorageError');
    var AuthenticationError = require('./AuthenticationError');
    
    var logger = console; // replace with your own logger
    
    var se = new StorageError('DB doe\'snt respond');
    var ae = new AuthenticationError('ID or password is wrong');
    
    function errorHandler(err) {
      if(!err){
        return;
      }
      if(err instanceof StorageError){
        logger.error('can\'t access to storage');
      }
      if(err instanceof AuthenticationError){
        logger.info('Authenticatin Failed');
      }
    
      switch(err.type) {
        case 'critical':
          // Mail.to('you@example.com').body('Your app seems does\'nt work properly:\n'+err.stack).send();
          logger.error('critical error ocurred');
          break;
        case 'noncritical':
          logger.error('noncritical error ocurred');
          break;
        default:
          logger.error('unknown type error');
          logger.error(util.inspect(err));
          break;
      }
    }

    errorHandler(se);
    errorHandler(ae);
    errorHandler(new Error('err!'));


これをサーバアプリケーション内で使う場合、HTTPのステータスコードをエラーオブジェクトに持たせておいてレスポンスの際にエラーオブジェクトからの内容、例えば`AuthenticationError`の場合は`401`などをセットするなんて事も可能ですね。

また、エラーオブジェクトを引数に取るエラークラスというのも有用です。先ほどのStorageErrorの場合でいうと、データベースにクエリーを送った場合に発生するエラーをハンドリングできるようにします。例えば

    function getUserId(cb){
      query.send(function(err, rows){
        if(err){
          cb(new StorageError(err));
        }
      });
      cb(null, rows);
    }

などのようにして利用します。

### errorイベント

非同期処理を行う関数中ではイベントエミッターを利用し、エラー発生時にはエラーイベントをemitして利用側にエラーを通知します。

    var EventEmitter = require('events').EventEmitter;
    
    function asyncFunc() {
      var ee = new EventEmitter();
      setTimeout(function() {
        ee.emit('whoa');
        ee.emit('error');
      },1);
    }
    
    asyncFunc();

このサンプルを実行すると

    timers.js:103
                if (!process.listeners('uncaughtException').length) throw e;
                                                                          ^
    Error: Uncaught, unspecified 'error' event.
        at EventEmitter.emit (events.js:73:15)
        at Object._onTimeout (/ErrorEvent/errorEmitter.js:7:8)
        at Timer.list.ontimeout (timers.js:101:19)

このようなエラーが発生してプログラムが途中で終了しているのがわかります。_whoa_というイベントが発生しているときには処理が継続されるのに対して、_error_イベントが発生した場合には処理が途中で止まってしまうのは、_error_という名前のイベントというのが少々特殊なためで、これを適切に処理しないとプログラムが終了してしまうのです。

ですので、_error_イベントをemitするものに対しては適切なエラーハンドリングが必要になります。以下のように、`on`で_error_イベントを適切に処理するようにしましょう。

    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    
    function AsyncFunc(){
      EventEmitter.call(this);
    }
    
    util.inherits(AsyncFunc, EventEmitter);
    
    AsyncFunc.prototype.emitError = function() {
      var self = this;
      setTimeout(function() {
        self.emit('error', new Error('error ocurred'));
      },1);
    };
    
    AsyncFunc.prototype.throwError = function() {
      var self = this;
      setTimeout(function() {
        throw new Error('error thrown');
      },1);
    };
    
    var af = new AsyncFunc();
    af.on('error', function(err){
      console.log('caught an emitted error: '+err);
    });
    af.emitError();
    
    try {
      af.throwError();
    } catch (err) {
      console.log('caught a thrown error: '+err);
    }

この例でも最後にはエラーを捕捉しきれず終了していますが、これは非同期関数の中で例外を投げており、それを捕捉しきれていないためです。errorイベントは捕捉しているため、コンソールには`caught an emitted error:`という表示が見えるはずです。

### uncaughtException、Domainを使ったエラーハンドリング

プログラム実行中に例えば定義されていない関数を呼び出してしまうと`ReferenceError`が発生してプログラムが驟雨漁してしまいます。

	foo();

とだけ記述したプログラムを実行するとすぐわかります。サーバープログラムなどではそういった場合にでも処理を続けたい局面がありますが、この場合、`uncaughtException`のハンドラーを追加したり、`Domain`という機能を利用してサーバーが終了してしまう事を避ける事が可能です。
まずは`uncaughtException`のハンドリングは以下のようにして`process`に対し、`uncaughtException`のハンドラーを追加して行います。

	process.on('uncaughtException', function(err) {
	  console.log('uncaughtException: '+err);
	});
	
	foo();

実行するとエラーを捕捉しているのがわかります。ですが`uncaughtException`が発生した時点であなたのアプリケーションの状態はもはや不安定になっているので、サーバープログラムであれば速やかに該当プロセスを終了し、再起動することが強く推奨されます。最後の砦としてのみ利用してください、というか次に説明する`Domain`を利用しましょう。あ、いや`Domain`使っても大抵の場合、プロセスを再起動したほうが良い場合ばかりですからね。

さて、0.8系(正確に言うと0.7.8)から導入された`Domain`を利用するエラーハンドリングについて説明します。
`Domain`に`EventEmitter`を利用したものや非同期コールバックなどが登録されると、先ほどの`process.on('uncaughtExecption,func(){…});`などの代わりにエラーがドメインオブジェクトに通知されるようになり、`Domain`を利用したエラーハンドリングが可能になります。

`Domain`の利用にはまず、`Domain`の作成、リスナーへのエラー処理の記述、監視対象の登録が必要になります。
実際に先ほどの例を`Domain`を利用して書き直してみます。

// wrapWithDomain.js

	var domain = require('domain');
	var d = domain.create();
	d.on('error', function(err) {
	  console.log('caught error: '+err);
	});
	
	d.run(function(){
	  foo();
	});
	
	// other way to do it
	// d.enter();
	// foo();
	// d.exit();
	
	/*
	 * coud run till 0.8.9, but no more...
	 * d.add(process);
	 * foo();
	 */

上記の例ではドメインの作成後、`on('error',function(){…})`としてエラー処理を記述し、`run()`を利用して関数を登録しています。`Domain`への登録ですが、`run()`の他にも`add()`や`bind()`、`intercept()`といったAPIで登録が可能です。使い分けとしては`run()`は引数に関数、`add()`は`EventEmitter`や`Timer`、`bind()`と`intercept()`はコールバック関数を引数に取ります。さらに`bind()`と`intercept()`の違いについてですが、これは非常に似たAPIで、`intercept()`を利用するとコールバックの第一引数がエラーオブジェクトの場合、コールバック中でエラーを明示的に`throw`しなくても`Domain`にエラーが通知されるという部分が異なります。ということで`bind()`はエラーの`throw`が必要です。

例示してみましょう。`bind()`を利用する場合は

	d.bind(function(err, result) {
	  if(err) throw err;
	  cb(result);
	});

と記述する必要があるのに対して、`intercept()`では

	d.intercept(function(err, result) {
	  cb(result);
	});

このようにすっきりと記述できます。

// bindAndIntercept.js

	var fs = require('fs'),
	    util = require('util'),
	    domain = require('domain');
	
	var d = domain.create();
	
	d.on('error', function(err) {
	  console.log('caught an error: ' + util.inspect(err));
	});
	
	// bind
	fs.readFile('./noexist.txt', 'utf-8', d.bind(function(err, data) {
	  if (err) {
	    throw err;
	  }
	  console.log(data);
	}));
	
	// intercept
	fs.readFile('./noexist2.txt', 'utf-8', d.intercept(function(err, data) {
	  console.log(data);
	}));



## assertionライブラリ

### assertionライブラリの使い方

assertionライブラリとはオブジェクト、あるいはその一部（プロパティなど）に着目し、その値が期待するものかどうかをチェックするためのライブラリ。テストの中で多用され、アプリケーションコードの中でもたまに見ることがあるのだけれど、もし期待値が違ってチェックに失敗した場合、assertionライブラリは大抵例外を`throw`するので、利用はテストプログラム中に限定し、サーバプログラムのような動作を途中で止めたくないプログラムの中では特に、assertionライブラリは使わないほうがよいです。C/C++/Java などのような処理系ではリリースビルドの際に assertion コードが取り除かれる、もしくは無効化されるといったことも可能になるのですが・・・。ところで assertion は wikipedia によればアラン・チューリングによって最初に提案されたそうです。長い歴史を持っているのですね。

assertion は主に以下のチェックにより行われます。

* 存在
* 同値
* 比較

要するに、値/プロパティなどが存在するかどうか、期待値と実値が同一かどうか、比較値に対して実値が期待する範囲のものか、などをチェックするわけですね。ということでこれを行ういくつかの assertion ライブラリを紹介します。

* assert
* should
* chai
* expect

### assert

Node.js の標準モジュールとして組み込まれている assertion ライブラリです。

[assertモジュールドキュメント](http://nodejs.jp/nodejs.org_ja/docs/v0.10/api/assert.html)

Node.jsプログラム中では `require('assert')` とすることですぐに呼び出すことが可能です。

	var assert = require('assert');

よく利用するのは値が truthy であるかどうかを判別する `assert.ok()` 、また同値性をチェックする `equal(), deepEqual(), strictEqual()` 、関数内で利用し、第一引数にエラーが渡されたかどうかをチェックする `ifError()` です。 `throws(), doesNotThrows()` は必要に応じて。

例：assert.js

    var assert = require('assert');
    
    var a = 1;
    var b = "ok";
    var c = null;
    var d = 1;
    var e = "nok";
    
    assert.throws(
      function() {
        try {
          assert.ok(a);
          assert.ok(b);
          assert.ok(c); // throws
        } catch (error) {
          console.log('error: ' + error);
          throw error;
        }
      }
    );
    
    assert.throws(
      function() {
        try {
          assert.equal(a, 1);
          assert.deepEqual(a, 1);
          assert.strictEqual(a, 1);
          assert.equal(a, "1");
          assert.deepEqual(a, "1");
          assert.strictEqual(a, "1"); // throws
        } catch (error) {
          console.log('error: ' + error);
          throw error;
        }
      }
    );
    
    function passError(cb) {
      cb(new Error('toss'), "result");
      return;
    }
    
    function catchError(error, result) {
      assert.throws(function() {
        try {
          assert.ifError(error); // trhows
        } catch (e) {
          console.log('error: ' + e);
          throw e;
        }
      });
    }
    
    passError(catchError);

### should

TJ氏作の assertion ライブラリで、標準の `assert` モジュールに比べ、機能的に大幅に強化されています。
特徴的なのは Object の Prototype を拡張している点です。ですので `someObject.should.equal(1)` と言った記述が可能となり、可読性をあげることが可能となります。

APIはこちら

[should.js(github)](https://github.com/visionmedia/should.js)

ただ、Object の Prototype を拡張することにはいささか問題もあり、たとえば値が undefined や null であるオブジェクトに対して should を利用することはできません。実際にテストを書く場合、こちらがネックとなることが予想されます。

### expect

Guillermo Rauch氏作の should をもとにしたBDD向け Assertion ライブラリ。彼の所属する LearnBoost ではTJ氏も働いています。shouldを拡張しただけあって、うまく should の弱みを修正しています。
利用法としては `expect()` に対象オブジェクトを渡し、 `expect(testObject).to.be(undefined)` のようにして使います。APIはBDDスタイルで使えるものが多いのですが、 `to.only.have.keys()` など、記述が長くなってくるのである程度覚えこむか、IDEのように入力支援機能がないと最初は辛いかもしれません。
to.be() や not.to.be() などといった記述が可能なのでハムレット好きにオススメ。なんて。

[expect.js](https://github.com/LearnBoost/expect.js)

### chai

こちらはJake Luer氏作の、assertion ライブラリです。新しくテストを書き始める場合には、他のライブラリへのしがらみがない限り、こちらを使うのが良いと思われます。なので本来であれば真っ先に紹介すべきなのですが、あえて最後に持ってきました。

というのも、assert、should、expect にある機能はこのchaiからも利用可能なので、つまりスーパーセットとして機能しうるのです。さらにはブラウザ上でも動作するのでクライアントサイドでも利用でき、プラグインによる機能拡張が可能、 assert については大幅に機能拡張されており、必要なものは大抵網羅されているなど、現時点では assertion ライブラリの決定版とも言えるでしょう。利用は

    var assert = require('chai').assert;
    var should = require('chai').should();
    var expect = require('chai').expect;

このようにして今まで説明してきた3種類の assertion スタイルを利用可能になります。
APIについてはこちらを参照のこと。

[chaijs](http://chaijs.com)

assertionライブラリ自体、APIを少し覚えるだけで、使い方自体は全く難しくありません。要するに存在チェックやら同値チェック、比較をする程度のものですので。assertion 自体は釘と金槌のようなプリミティブな道具です。


## テストフレームワークの利用

### mochaとは

Node.jsで利用可能なテストフレームワークにはいろいろありますが、今ではmochaが一番使われているのではないでしょうか？必要十分な機能を持ち、うっかりミスによるグローバル変数の検知なども可能です。これ一点でmochaに決めても良いくらい。というのも、例えばあなたの作ったglobal leakage付きモジュールが誰かのモジュールから利用される場合、その相手側のモジュールがmochaを使うとあなたのモジュールでエラーが発生してしまうのです。そういう、ちょっとこっぱずかしい思いをしないためにもmochaを使うべきでしょう。(と思ったらmochaの最新版ではこのチェックがデフォルトでは有効ではなくなっている！＠＃＄！！ので、`--check-leaks`オプションを付けて実行するようにしましょう。)
            
#### イニシャルセットアップ

	npm install mocha

とすることですぐにインストール可能です。`"-g"`オプションを付けてグローバルにインストールするのも良いですが、モジュールを作成している際などはグローバルにインストールせず、`"npm test"`経由で利用できるように設定するのも良いでしょう。その場合、`package.json`中の`script`エントリを`"scripts" : {"test" : "./node_modules/.bin/mocha"}`のように設定すると、`"npm test"`コマンドでmochaを起動できるようになります。

#### mochaの利用

テストファイル名を指定せずに`mocha`コマンドを実行するとそのディレクトリ内の`test`ディレクトリ以下にあるファイルがテストファイルとしてみなされ、実行されます。もしtestディレクトリ内にサブディレクトリがあって、その内部のテストも実行したい場合には`"--recursive"`オプションを付けて実行してください。

またmocha向けのテストのインターフェースとしてBDD、TDD、Expect、Qunitといったものが利用可能です。今回はTDDを利用してみます。以下にTDDインターフェースを利用するひな形を用意してみました。
なお、インターフェースの指定には`"--ui"`オプションを利用します。ですので今回は`"mocha --ui tdd"`として実行することでテストされます。

// testTemplate.js
	
	suite('SampleTestSuite', function(){
	  suiteSetup(function(done) {
	  	// テストスイートのセットアップ処理
	    done();
	  });
	  setup(function(done){
	  	// 各テスト前に実行される初期化処理
	    done();
	  });
	  teardown(function(done){
	  	// 各テスト後に実行される終了処理
	    done();
	  });
	  test('Sample Test 1', function(done) {
	    done();
	  });
	  suiteTeardown(function(done) {
	    // テストスイートの終了処理
	    done();
	  });
	});

また、mochaでは結果表示の形式も様々です。どのような表示形式があるかは[こちら](http://mochajs.org/#reporters)を参照してみてください。指定自体は`"--reporter"`オプションによって指定します。
これら`"--ui"`や`"--reporter"`といったオプションは`test`ディレクトリ配下の`"mocha.opts"`ファイル内に記述することも可能です。今回はspec形式で表示させるようにして、UIオプションと一緒に`mocha.opts`内に書いておきます。

// mocha.opts

	--ui tdd
	--reporter spec

これで準備が整いました。カレントディレクトリの`test`ディレクトリ内に上記`testTemplate.js`と`mocha.opts`がある状態で`mocha`コマンドを実行してみましょう。出力は以下のようになります。
	
	  SampleTestSuite
	    ✓ Sample Test 1
	
	
	  1 test complete (2 ms)

何をテストするのかは決まっているがテストをまだ書いていない場合、`test('write this later');`などのようにテストコードは書かず記述だけしておく事でテストをペンディングの状態に留めておく事ができます。

ところでtestの第二引数の関数に渡しているdoneとはなんでしょうか？これは非同期テストに利用するもので、非同期関数の中などでdoneを呼ぶ事でそのテストの終了をmochaに伝えます。同期テストの際にはdoneは必要ありません（付けておいてもいいかもですが）。

	test('Test 1+1 after 50ms', function(done) {
		setTimeout(function(){
			assert(1+1, 2);
			done();
		},50);
	});

書き方としてはこのようになります。ところでここで50msの待ち時間を2000msにするとどうなるでしょうか？途端にmochaは文句を言って終了してしまいます。

	  SampleTestSuite
	    1) test 1+1
	    - test 1+2
	    - test 1+3
	
	
	  ✖ 1 of 3 tests failed:
	
	  1) SampleTestSuite test 1+1:
	     Error: timeout of 2000ms exceeded
	      at Object.<anonymous> (/Users/you/PrepareMocha3/node_modules/mocha/lib/runnable.js:167:14)
	      at Timer.list.ontimeout (timers.js:101:19)
	
	
	npm ERR! Test failed.  See above for more details.
	npm ERR! not ok code 0

これはmochaで定義されているテスト一つ当たりの制限時間が2000msに設定されているためです。これを回避するためには個別にタイムアウトを設定します。設定には`timeout()`を利用します。

	test('Test 1+1 after 2000ms', function(done) {
		this.timeout(3000);
		setTimeout(function(){
			assert(1+1, 2);
			done();
		},2000);
	});

設定は`test()`、`suite()`内のどちらにおいても可能です。また`"--timeout"`オプションで指定する事でテスト全体のタイムアウトを指定する事も可能です。

数あるsuiteやtestのうち、一つだけ実行したい場合は`.only`を利用します。`test.only('Only this test will be executed', function(){})`などと記述すると、こちらのtestのみが実行されます。また、suiteやtestをスキップすることも可能で、それには`.skip`を利用します。


### Testの実際

では実際にTestを書く事にしましょうか。まずはモジュールレベルから書く事にします。モジュールはそうですね、非同期のモジュールじゃないと面白くないので、CSVを利用したKVSっぽいものにでもしましょうか。

ということで第一回目の仕様。第一回と書いてあるのはおそらく一発では決まらないからです。

**TSVKVSドライバ仕様**

ファイル名を渡して初期化、インスタンス化し、キーに基づいて情報の格納、取り出しを行う。データの格納先はコンストラクタに渡したファイル名を持つファイル。
メソッドは

* get(key)
* set(key, value)

今のところこれだけ。

さて、これだけの仕様からテストを考えてみる。ファイル名を渡して初期化するので、コンストラクタはファイル名を取りますね。で、APIは先ほどの二つ。Errorは一応カスタムで定義しておきます。で、とりあえずモジュール用のディレクトリを作成し、現時点でのREADMEファイルを作成して、仕様を書き起こしてみます。

	# TSVKVS
	
	This module provides KVS service using TSV.
	
	## Install
	
	npm install tsvkvs
	
	## Usage
	
	Create a server for TSVKVS service. The constructor takes a filename for data storage.
	
	    var TsvKvs = require('tsvkvs');
	    var tkServer = new TsvKvs.Server('./data.tsv');
	    var TsvKvsError = TsvKvs.Error;
	
	The server object emits 2 events
	
	    tkServer.on('connect', function() {}); // TsvKvs service is available
	    tkServer.on('error' function(err) {}); // An error ocurred in the TsvKvs server
	
	After connectiong, we can set/get a value
	
	    var key = 'a';
	
	    tk.set(key, 'test1', function(err, result) {
	      if(err) {
	        throw new TsvKvsError(err);
	      }
	      if(result){
	        console.log('stored value for '+key);
	      } else {
	        console.log('not stored value for '+key);
	      }
	    });
	
	    tk.get(key, function(err, result) {
	      if(err) {
	        throw new TsvKvsError(err);
	      }
	      if(result){
	        console.log('got value for '+key);
	      } else {
	        console.log('got no value for '+key);
	      }
	    });

こんな感じとして、テストのテンプレートを作成してtestディレクトリに格納しておきます。モジュールのファイル構成としてはモジュールのルートにindex.jsを置いてlib以下のファイル群を参照するかたちでいいかな？


ってか書いている途中です。追いつけ追い越せいやダメだ負けるな抜かせるな。という最前線が・・・

---------------------------------------------ココ--------------------------------------------

