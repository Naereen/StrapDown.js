(function() {
  /**
   * @param {Object} options
   * @return {undefined}
   */
  function Lexer(options) {
    /** @type {Array} */
    this.tokens = [];
    this.tokens.links = {};
    this.options = options || marked.defaults;
    this.rules = block.normal;
    if (this.options.gfm) {
      if (this.options.tables) {
        this.rules = block.tables;
      } else {
        this.rules = block.gfm;
      }
    }
  }
  /**
   * @param {?} links
   * @param {Object} options
   * @return {undefined}
   */
  function InlineLexer(links, options) {
    this.options = options || marked.defaults;
    this.links = links;
    this.rules = inline.normal;
    if (!this.links) {
      throw new Error("Tokens array requires a `links` property.");
    }
    if (this.options.gfm) {
      if (this.options.breaks) {
        this.rules = inline.breaks;
      } else {
        this.rules = inline.gfm;
      }
    } else {
      if (this.options.pedantic) {
        this.rules = inline.pedantic;
      }
    }
  }
  /**
   * @param {Object} options
   * @return {undefined}
   */
  function Parser(options) {
    /** @type {Array} */
    this.tokens = [];
    /** @type {null} */
    this.token = null;
    this.options = options || marked.defaults;
  }
  /**
   * @param {?} html
   * @param {boolean} encode
   * @return {?}
   */
  function escape(html, encode) {
    return html.replace(!encode ? /&(?!#?\w+;)/g : /&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /**
   * @param {(Object|string)} regex
   * @param {string} opt
   * @return {?}
   */
  function replace(regex, opt) {
    regex = regex.source;
    opt = opt || "";
    return function self(name, val) {
      if (!name) {
        return new RegExp(regex, opt);
      }
      val = val.source || val;
      val = val.replace(/(^|[^\[])\^/g, "$1");
      regex = regex.replace(name, val);
      return self;
    };
  }
  /**
   * @return {undefined}
   */
  function noop() {
  }
  /**
   * @param {?} opt_attributes
   * @return {?}
   */
  function merge(opt_attributes) {
    /** @type {number} */
    var i = 1;
    var mixin;
    var key;
    for (;i < arguments.length;i++) {
      mixin = arguments[i];
      for (key in mixin) {
        if (Object.prototype.hasOwnProperty.call(mixin, key)) {
          opt_attributes[key] = mixin[key];
        }
      }
    }
    return opt_attributes;
  }
  /**
   * @param {string} src
   * @param {Object} opt
   * @return {?}
   */
  function marked(src, opt) {
    try {
      if (opt) {
        opt = merge({}, marked.defaults, opt);
      }
      return Parser.parse(Lexer.lex(src, opt), opt);
    } catch (ex) {
      ex.message += "\nPlease report this to https://github.com/chjj/marked.";
      if ((opt || marked.defaults).silent) {
        return "An error occured:\n" + ex.message;
      }
      throw ex;
    }
  }
  var block = {
    newline : /^\n+/,
    code : /^( {4}[^\n]+\n*)+/,
    /** @type {function (): undefined} */
    fences : noop,
    hr : /^( *[-*_]){3,} *(?:\n+|$)/,
    heading : /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
    /** @type {function (): undefined} */
    nptable : noop,
    lheading : /^([^\n]+)\n *(=|-){3,} *\n*/,
    blockquote : /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
    list : /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
    html : /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
    def : /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
    /** @type {function (): undefined} */
    table : noop,
    paragraph : /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
    text : /^[^\n]+/
  };
  /** @type {RegExp} */
  block.bullet = /(?:[*+-]|\d+\.)/;
  /** @type {RegExp} */
  block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
  block.item = replace(block.item, "gm")(/bull/g, block.bullet)();
  block.list = replace(block.list)(/bull/g, block.bullet)("hr", /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)();
  /** @type {string} */
  block._tag = "(?!(?:" + "a|em|strong|small|s|cite|q|dfn|abbr|data|time|code" + "|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo" + "|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b";
  block.html = replace(block.html)("comment", /\x3c!--[\s\S]*?--\x3e/)("closed", /<(tag)[\s\S]+?<\/\1>/)("closing", /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g, block._tag)();
  block.paragraph = replace(block.paragraph)("hr", block.hr)("heading", block.heading)("lheading", block.lheading)("blockquote", block.blockquote)("tag", "<" + block._tag)("def", block.def)();
  block.normal = merge({}, block);
  block.gfm = merge({}, block.normal, {
    fences : /^ *(`{3,}|~{3,}) *(\w+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
    paragraph : /^/
  });
  block.gfm.paragraph = replace(block.paragraph)("(?!", "(?!" + block.gfm.fences.source.replace("\\1", "\\2") + "|")();
  block.tables = merge({}, block.gfm, {
    nptable : /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
    table : /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
  });
  Lexer.rules = block;
  /**
   * @param {string} src
   * @param {string} options
   * @return {?}
   */
  Lexer.lex = function(src, options) {
    var lexer = new Lexer(options);
    return lexer.lex(src);
  };
  /**
   * @param {string} src
   * @return {?}
   */
  Lexer.prototype.lex = function(src) {
    src = src.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ").replace(/\u00a0/g, " ").replace(/\u2424/g, "\n");
    return this.token(src, true);
  };
  /**
   * @param {?} src
   * @param {boolean} top
   * @return {?}
   */
  Lexer.prototype.token = function(src, top) {
    src = src.replace(/^ +$/gm, "");
    var next;
    var loose;
    var cap;
    var val;
    var skip;
    var item;
    var space;
    var i;
    var l;
    for (;src;) {
      if (cap = this.rules.newline.exec(src)) {
        src = src.substring(cap[0].length);
        if (cap[0].length > 1) {
          this.tokens.push({
            type : "space"
          });
        }
      }
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length);
        cap = cap[0].replace(/^ {4}/gm, "");
        this.tokens.push({
          type : "code",
          text : !this.options.pedantic ? cap.replace(/\n+$/, "") : cap
        });
        continue;
      }
      if (cap = this.rules.fences.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "code",
          lang : cap[2],
          text : cap[3]
        });
        continue;
      }
      if (cap = this.rules.heading.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "heading",
          depth : cap[1].length,
          text : cap[2]
        });
        continue;
      }
      if (top && (cap = this.rules.nptable.exec(src))) {
        src = src.substring(cap[0].length);
        item = {
          type : "table",
          header : cap[1].replace(/^ *| *\| *$/g, "").split(/ *\| */),
          align : cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
          cells : cap[3].replace(/\n$/, "").split("\n")
        };
        /** @type {number} */
        i = 0;
        for (;i < item.align.length;i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            /** @type {string} */
            item.align[i] = "right";
          } else {
            if (/^ *:-+: *$/.test(item.align[i])) {
              /** @type {string} */
              item.align[i] = "center";
            } else {
              if (/^ *:-+ *$/.test(item.align[i])) {
                /** @type {string} */
                item.align[i] = "left";
              } else {
                /** @type {null} */
                item.align[i] = null;
              }
            }
          }
        }
        /** @type {number} */
        i = 0;
        for (;i < item.cells.length;i++) {
          item.cells[i] = item.cells[i].split(/ *\| */);
        }
        this.tokens.push(item);
        continue;
      }
      if (cap = this.rules.lheading.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "heading",
          depth : cap[2] === "=" ? 1 : 2,
          text : cap[1]
        });
        continue;
      }
      if (cap = this.rules.hr.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "hr"
        });
        continue;
      }
      if (cap = this.rules.blockquote.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "blockquote_start"
        });
        cap = cap[0].replace(/^ *> ?/gm, "");
        this.token(cap, top);
        this.tokens.push({
          type : "blockquote_end"
        });
        continue;
      }
      if (cap = this.rules.list.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "list_start",
          ordered : isFinite(cap[2])
        });
        cap = cap[0].match(this.rules.item);
        if (this.options.smartLists) {
          /** @type {string} */
          val = block.bullet.exec(cap[0])[0];
        }
        /** @type {boolean} */
        next = false;
        l = cap.length;
        /** @type {number} */
        i = 0;
        for (;i < l;i++) {
          item = cap[i];
          space = item.length;
          item = item.replace(/^ *([*+-]|\d+\.) +/, "");
          if (~item.indexOf("\n ")) {
            space -= item.length;
            item = !this.options.pedantic ? item.replace(new RegExp("^ {1," + space + "}", "gm"), "") : item.replace(/^ {1,4}/gm, "");
          }
          if (this.options.smartLists && i !== l - 1) {
            /** @type {string} */
            skip = block.bullet.exec(cap[i + 1])[0];
            if (val !== skip && !(val[1] === "." && skip[1] === ".")) {
              src = cap.slice(i + 1).join("\n") + src;
              /** @type {number} */
              i = l - 1;
            }
          }
          /** @type {boolean} */
          loose = next || /\n\n(?!\s*$)/.test(item);
          if (i !== l - 1) {
            /** @type {boolean} */
            next = item[item.length - 1] === "\n";
            if (!loose) {
              /** @type {boolean} */
              loose = next;
            }
          }
          this.tokens.push({
            type : loose ? "loose_item_start" : "list_item_start"
          });
          this.token(item, false);
          this.tokens.push({
            type : "list_item_end"
          });
        }
        this.tokens.push({
          type : "list_end"
        });
        continue;
      }
      if (cap = this.rules.html.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : this.options.sanitize ? "paragraph" : "html",
          pre : cap[1] === "pre",
          text : cap[0]
        });
        continue;
      }
      if (top && (cap = this.rules.def.exec(src))) {
        src = src.substring(cap[0].length);
        this.tokens.links[cap[1].toLowerCase()] = {
          href : cap[2],
          title : cap[3]
        };
        continue;
      }
      if (top && (cap = this.rules.table.exec(src))) {
        src = src.substring(cap[0].length);
        item = {
          type : "table",
          header : cap[1].replace(/^ *| *\| *$/g, "").split(/ *\| */),
          align : cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
          cells : cap[3].replace(/(?: *\| *)?\n$/, "").split("\n")
        };
        /** @type {number} */
        i = 0;
        for (;i < item.align.length;i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            /** @type {string} */
            item.align[i] = "right";
          } else {
            if (/^ *:-+: *$/.test(item.align[i])) {
              /** @type {string} */
              item.align[i] = "center";
            } else {
              if (/^ *:-+ *$/.test(item.align[i])) {
                /** @type {string} */
                item.align[i] = "left";
              } else {
                /** @type {null} */
                item.align[i] = null;
              }
            }
          }
        }
        /** @type {number} */
        i = 0;
        for (;i < item.cells.length;i++) {
          item.cells[i] = item.cells[i].replace(/^ *\| *| *\| *$/g, "").split(/ *\| */);
        }
        this.tokens.push(item);
        continue;
      }
      if (top && (cap = this.rules.paragraph.exec(src))) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "paragraph",
          text : cap[1][cap[1].length - 1] === "\n" ? cap[1].slice(0, -1) : cap[1]
        });
        continue;
      }
      if (cap = this.rules.text.exec(src)) {
        src = src.substring(cap[0].length);
        this.tokens.push({
          type : "text",
          text : cap[0]
        });
        continue;
      }
      if (src) {
        throw new Error("Infinite loop on byte: " + src.charCodeAt(0));
      }
    }
    return this.tokens;
  };
  var inline = {
    escape : /^\\([\\`*{}\[\]()#+\-.!_>])/,
    autolink : /^<([^ >]+(@|:\/)[^ >]+)>/,
    /** @type {function (): undefined} */
    url : noop,
    tag : /^\x3c!--[\s\S]*?--\x3e|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
    link : /^!?\[(inside)\]\(href\)/,
    reflink : /^!?\[(inside)\]\s*\[([^\]]*)\]/,
    nolink : /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
    strong : /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
    em : /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
    code : /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
    br : /^ {2,}\n(?!\s*$)/,
    /** @type {function (): undefined} */
    del : noop,
    text : /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
  };
  /** @type {RegExp} */
  inline._inside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
  /** @type {RegExp} */
  inline._href = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;
  inline.link = replace(inline.link)("inside", inline._inside)("href", inline._href)();
  inline.reflink = replace(inline.reflink)("inside", inline._inside)();
  inline.normal = merge({}, inline);
  inline.pedantic = merge({}, inline.normal, {
    strong : /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em : /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
  });
  inline.gfm = merge({}, inline.normal, {
    escape : replace(inline.escape)("])", "~|])")(),
    url : /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
    del : /^~~(?=\S)([\s\S]*?\S)~~/,
    text : replace(inline.text)("]|", "~]|")("|", "|https?://|")()
  });
  inline.breaks = merge({}, inline.gfm, {
    br : replace(inline.br)("{2,}", "*")(),
    text : replace(inline.gfm.text)("{2,}", "*")()
  });
  InlineLexer.rules = inline;
  /**
   * @param {?} src
   * @param {Array} links
   * @param {Array} options
   * @return {?}
   */
  InlineLexer.output = function(src, links, options) {
    var inline = new InlineLexer(links, options);
    return inline.output(src);
  };
  /**
   * @param {?} src
   * @return {?}
   */
  InlineLexer.prototype.output = function(src) {
    /** @type {string} */
    var out = "";
    var link;
    var text;
    var href;
    var cap;
    for (;src;) {
      if (cap = this.rules.escape.exec(src)) {
        src = src.substring(cap[0].length);
        out += cap[1];
        continue;
      }
      if (cap = this.rules.autolink.exec(src)) {
        src = src.substring(cap[0].length);
        if (cap[2] === "@") {
          text = cap[1][6] === ":" ? this.mangle(cap[1].substring(7)) : this.mangle(cap[1]);
          href = this.mangle("mailto:") + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }
        out += '<a href="' + href + '">' + text + "</a>";
        continue;
      }
      if (cap = this.rules.url.exec(src)) {
        src = src.substring(cap[0].length);
        text = escape(cap[1]);
        href = text;
        out += '<a href="' + href + '">' + text + "</a>";
        continue;
      }
      if (cap = this.rules.tag.exec(src)) {
        src = src.substring(cap[0].length);
        out += this.options.sanitize ? escape(cap[0]) : cap[0];
        continue;
      }
      if (cap = this.rules.link.exec(src)) {
        src = src.substring(cap[0].length);
        out += this.outputLink(cap, {
          href : cap[2],
          title : cap[3]
        });
        continue;
      }
      if ((cap = this.rules.reflink.exec(src)) || (cap = this.rules.nolink.exec(src))) {
        src = src.substring(cap[0].length);
        link = (cap[2] || cap[1]).replace(/\s+/g, " ");
        link = this.links[link.toLowerCase()];
        if (!link || !link.href) {
          out += cap[0][0];
          src = cap[0].substring(1) + src;
          continue;
        }
        out += this.outputLink(cap, link);
        continue;
      }
      if (cap = this.rules.strong.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<strong>" + this.output(cap[2] || cap[1]) + "</strong>";
        continue;
      }
      if (cap = this.rules.em.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<em>" + this.output(cap[2] || cap[1]) + "</em>";
        continue;
      }
      if (cap = this.rules.code.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<code>" + escape(cap[2], true) + "</code>";
        continue;
      }
      if (cap = this.rules.br.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<br>";
        continue;
      }
      if (cap = this.rules.del.exec(src)) {
        src = src.substring(cap[0].length);
        out += "<del>" + this.output(cap[1]) + "</del>";
        continue;
      }
      if (cap = this.rules.text.exec(src)) {
        src = src.substring(cap[0].length);
        out += escape(cap[0]);
        continue;
      }
      if (src) {
        throw new Error("Infinite loop on byte: " + src.charCodeAt(0));
      }
    }
    return out;
  };
  /**
   * @param {Array} cap
   * @param {Element} link
   * @return {?}
   */
  InlineLexer.prototype.outputLink = function(cap, link) {
    if (cap[0][0] !== "!") {
      return'<a href="' + escape(link.href) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : "") + ">" + this.output(cap[1]) + "</a>";
    } else {
      return'<img src="' + escape(link.href) + '" alt="' + escape(cap[1]) + '"' + (link.title ? ' title="' + escape(link.title) + '"' : "") + ">";
    }
  };
  /**
   * @param {string} text
   * @return {?}
   */
  InlineLexer.prototype.mangle = function(text) {
    /** @type {string} */
    var out = "";
    var l = text.length;
    /** @type {number} */
    var i = 0;
    var ch;
    for (;i < l;i++) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) {
        ch = "x" + ch.toString(16);
      }
      out += "&#" + ch + ";";
    }
    return out;
  };
  /**
   * @param {string} resp
   * @param {string} options
   * @return {?}
   */
  Parser.parse = function(resp, options) {
    var model = new Parser(options);
    return model.parse(resp);
  };
  /**
   * @param {Object} src
   * @return {?}
   */
  Parser.prototype.parse = function(src) {
    this.inline = new InlineLexer(src.links, this.options);
    this.tokens = src.reverse();
    /** @type {string} */
    var out = "";
    for (;this.next();) {
      out += this.tok();
    }
    return out;
  };
  /**
   * @return {?}
   */
  Parser.prototype.next = function() {
    return this.token = this.tokens.pop();
  };
  /**
   * @return {?}
   */
  Parser.prototype.peek = function() {
    return this.tokens[this.tokens.length - 1] || 0;
  };
  /**
   * @return {?}
   */
  Parser.prototype.parseText = function() {
    var body = this.token.text;
    for (;this.peek().type === "text";) {
      body += "\n" + this.next().text;
    }
    return this.inline.output(body);
  };
  /**
   * @return {?}
   */
  Parser.prototype.tok = function() {
    switch(this.token.type) {
      case "space":
        return "";
      case "hr":
        return "<hr>\n";
      case "heading":
        return "<h" + this.token.depth + ">" + this.inline.output(this.token.text) + "</h" + this.token.depth + ">\n";
      case "code":
        if (this.options.highlight) {
          var code = this.options.highlight(this.token.text, this.token.lang);
          if (code != null && code !== this.token.text) {
            /** @type {boolean} */
            this.token.escaped = true;
            this.token.text = code;
          }
        }
        if (!this.token.escaped) {
          this.token.text = escape(this.token.text, true);
        }
        return "<pre><code" + (this.token.lang ? ' class="' + this.options.langPrefix + this.token.lang + '"' : "") + ">" + this.token.text + "</code></pre>\n";
      case "table":
        /** @type {string} */
        var expires = "";
        var heading;
        var i;
        var row;
        var cell;
        var j;
        expires += "<thead>\n<tr>\n";
        /** @type {number} */
        i = 0;
        for (;i < this.token.header.length;i++) {
          heading = this.inline.output(this.token.header[i]);
          expires += this.token.align[i] ? '<th align="' + this.token.align[i] + '">' + heading + "</th>\n" : "<th>" + heading + "</th>\n";
        }
        expires += "</tr>\n</thead>\n";
        expires += "<tbody>\n";
        /** @type {number} */
        i = 0;
        for (;i < this.token.cells.length;i++) {
          row = this.token.cells[i];
          expires += "<tr>\n";
          /** @type {number} */
          j = 0;
          for (;j < row.length;j++) {
            cell = this.inline.output(row[j]);
            expires += this.token.align[j] ? '<td align="' + this.token.align[j] + '">' + cell + "</td>\n" : "<td>" + cell + "</td>\n";
          }
          expires += "</tr>\n";
        }
        expires += "</tbody>\n";
        return "<table>\n" + expires + "</table>\n";
      case "blockquote_start":
        /** @type {string} */
        expires = "";
        for (;this.next().type !== "blockquote_end";) {
          expires += this.tok();
        }
        return "<blockquote>\n" + expires + "</blockquote>\n";
      case "list_start":
        /** @type {string} */
        var type = this.token.ordered ? "ol" : "ul";
        /** @type {string} */
        expires = "";
        for (;this.next().type !== "list_end";) {
          expires += this.tok();
        }
        return "<" + type + ">\n" + expires + "</" + type + ">\n";
      case "list_item_start":
        /** @type {string} */
        expires = "";
        for (;this.next().type !== "list_item_end";) {
          expires += this.token.type === "text" ? this.parseText() : this.tok();
        }
        return "<li>" + expires + "</li>\n";
      case "loose_item_start":
        /** @type {string} */
        expires = "";
        for (;this.next().type !== "list_item_end";) {
          expires += this.tok();
        }
        return "<li>" + expires + "</li>\n";
      case "html":
        return!this.token.pre && !this.options.pedantic ? this.inline.output(this.token.text) : this.token.text;
      case "paragraph":
        return "<p>" + this.inline.output(this.token.text) + "</p>\n";
      case "text":
        return "<p>" + this.parseText() + "</p>\n";
    }
  };
  /** @type {function (): undefined} */
  noop.exec = noop;
  /** @type {function (?): ?} */
  marked.options = marked.setOptions = function(opt) {
    merge(marked.defaults, opt);
    return marked;
  };
  marked.defaults = {
    gfm : true,
    tables : true,
    breaks : false,
    pedantic : false,
    sanitize : false,
    smartLists : false,
    silent : false,
    highlight : null,
    langPrefix : "lang-"
  };
  /** @type {function (Object): undefined} */
  marked.Parser = Parser;
  /** @type {function (string, string): ?} */
  marked.parser = Parser.parse;
  /** @type {function (Object): undefined} */
  marked.Lexer = Lexer;
  /** @type {function (string, string): ?} */
  marked.lexer = Lexer.lex;
  /** @type {function (?, Object): undefined} */
  marked.InlineLexer = InlineLexer;
  /** @type {function (?, Array, Array): ?} */
  marked.inlineLexer = InlineLexer.output;
  /** @type {function (string, Object): ?} */
  marked.parse = marked;
  if (typeof exports === "object") {
    /** @type {function (string, Object): ?} */
    module.exports = marked;
  } else {
    if (typeof define === "function" && define.amd) {
      define(function() {
        return marked;
      });
    } else {
      /** @type {function (string, Object): ?} */
      this.marked = marked;
    }
  }
}).call(function() {
  return this || (typeof window !== "undefined" ? window : global);
}());
/** @type {boolean} */
window["PR_SHOULD_USE_CONTINUATION"] = true;
var prettyPrintOne;
var prettyPrint;
(function() {
  /**
   * @param {Array} regexs
   * @return {?}
   */
  function combinePrefixPatterns(regexs) {
    /**
     * @param {string} charsetPart
     * @return {?}
     */
    function decodeEscape(charsetPart) {
      var cc0 = charsetPart.charCodeAt(0);
      if (cc0 !== 92) {
        return cc0;
      }
      var c1 = charsetPart.charAt(1);
      cc0 = escapeCharToCodeUnit[c1];
      if (cc0) {
        return cc0;
      } else {
        if ("0" <= c1 && c1 <= "7") {
          return parseInt(charsetPart.substring(1), 8);
        } else {
          if (c1 === "u" || c1 === "x") {
            return parseInt(charsetPart.substring(2), 16);
          } else {
            return charsetPart.charCodeAt(1);
          }
        }
      }
    }
    /**
     * @param {number} charCode
     * @return {?}
     */
    function encodeEscape(charCode) {
      if (charCode < 32) {
        return(charCode < 16 ? "\\x0" : "\\x") + charCode.toString(16);
      }
      /** @type {string} */
      var ch = String.fromCharCode(charCode);
      return ch === "\\" || (ch === "-" || (ch === "]" || ch === "^")) ? "\\" + ch : ch;
    }
    /**
     * @param {string} charSet
     * @return {?}
     */
    function caseFoldCharset(charSet) {
      var charsetParts = charSet.substring(1, charSet.length - 1).match(new RegExp("\\\\u[0-9A-Fa-f]{4}" + "|\\\\x[0-9A-Fa-f]{2}" + "|\\\\[0-3][0-7]{0,2}" + "|\\\\[0-7]{1,2}" + "|\\\\[\\s\\S]" + "|-" + "|[^-\\\\]", "g"));
      /** @type {Array} */
      var ranges = [];
      /** @type {boolean} */
      var inverse = charsetParts[0] === "^";
      /** @type {Array} */
      var out = ["["];
      if (inverse) {
        out.push("^");
      }
      /** @type {number} */
      var i = inverse ? 1 : 0;
      var n = charsetParts.length;
      for (;i < n;++i) {
        var p = charsetParts[i];
        if (/\\[bdsw]/i.test(p)) {
          out.push(p);
        } else {
          var start = decodeEscape(p);
          var end;
          if (i + 2 < n && "-" === charsetParts[i + 1]) {
            end = decodeEscape(charsetParts[i + 2]);
            i += 2;
          } else {
            end = start;
          }
          ranges.push([start, end]);
          if (!(end < 65 || start > 122)) {
            if (!(end < 65 || start > 90)) {
              ranges.push([Math.max(65, start) | 32, Math.min(end, 90) | 32]);
            }
            if (!(end < 97 || start > 122)) {
              ranges.push([Math.max(97, start) & ~32, Math.min(end, 122) & ~32]);
            }
          }
        }
      }
      ranges.sort(function(vecA, vecB) {
        return vecA[0] - vecB[0] || vecB[1] - vecA[1];
      });
      /** @type {Array} */
      var consolidatedRanges = [];
      /** @type {Array} */
      var lastRange = [];
      /** @type {number} */
      i = 0;
      for (;i < ranges.length;++i) {
        var range = ranges[i];
        if (range[0] <= lastRange[1] + 1) {
          /** @type {number} */
          lastRange[1] = Math.max(lastRange[1], range[1]);
        } else {
          consolidatedRanges.push(lastRange = range);
        }
      }
      /** @type {number} */
      i = 0;
      for (;i < consolidatedRanges.length;++i) {
        range = consolidatedRanges[i];
        out.push(encodeEscape(range[0]));
        if (range[1] > range[0]) {
          if (range[1] + 1 > range[0]) {
            out.push("-");
          }
          out.push(encodeEscape(range[1]));
        }
      }
      out.push("]");
      return out.join("");
    }
    /**
     * @param {Object} regex
     * @return {?}
     */
    function allowAnywhereFoldCaseAndRenumberGroups(regex) {
      var parts = regex.source.match(new RegExp("(?:" + "\\[(?:[^\\x5C\\x5D]|\\\\[\\s\\S])*\\]" + "|\\\\u[A-Fa-f0-9]{4}" + "|\\\\x[A-Fa-f0-9]{2}" + "|\\\\[0-9]+" + "|\\\\[^ux0-9]" + "|\\(\\?[:!=]" + "|[\\(\\)\\^]" + "|[^\\x5B\\x5C\\(\\)\\^]+" + ")", "g"));
      var l = parts.length;
      /** @type {Array} */
      var capturedGroups = [];
      /** @type {number} */
      var i = 0;
      /** @type {number} */
      var groupIndex = 0;
      for (;i < l;++i) {
        var p = parts[i];
        if (p === "(") {
          ++groupIndex;
        } else {
          if ("\\" === p.charAt(0)) {
            /** @type {number} */
            var decimalValue = +p.substring(1);
            if (decimalValue) {
              if (decimalValue <= groupIndex) {
                /** @type {number} */
                capturedGroups[decimalValue] = -1;
              } else {
                parts[i] = encodeEscape(decimalValue);
              }
            }
          }
        }
      }
      /** @type {number} */
      i = 1;
      for (;i < capturedGroups.length;++i) {
        if (-1 === capturedGroups[i]) {
          /** @type {number} */
          capturedGroups[i] = ++capturedGroupIndex;
        }
      }
      /** @type {number} */
      i = 0;
      /** @type {number} */
      groupIndex = 0;
      for (;i < l;++i) {
        p = parts[i];
        if (p === "(") {
          ++groupIndex;
          if (!capturedGroups[groupIndex]) {
            /** @type {string} */
            parts[i] = "(?:";
          }
        } else {
          if ("\\" === p.charAt(0)) {
            /** @type {number} */
            decimalValue = +p.substring(1);
            if (decimalValue && decimalValue <= groupIndex) {
              parts[i] = "\\" + capturedGroups[decimalValue];
            }
          }
        }
      }
      /** @type {number} */
      i = 0;
      for (;i < l;++i) {
        if ("^" === parts[i] && "^" !== parts[i + 1]) {
          /** @type {string} */
          parts[i] = "";
        }
      }
      if (regex.ignoreCase && needToFoldCase) {
        /** @type {number} */
        i = 0;
        for (;i < l;++i) {
          p = parts[i];
          var ch0 = p.charAt(0);
          if (p.length >= 2 && ch0 === "[") {
            parts[i] = caseFoldCharset(p);
          } else {
            if (ch0 !== "\\") {
              parts[i] = p.replace(/[a-zA-Z]/g, function(a) {
                var cc = a.charCodeAt(0);
                return "[" + String.fromCharCode(cc & ~32, cc | 32) + "]";
              });
            }
          }
        }
      }
      return parts.join("");
    }
    /** @type {number} */
    var capturedGroupIndex = 0;
    /** @type {boolean} */
    var needToFoldCase = false;
    /** @type {boolean} */
    var ignoreCase = false;
    /** @type {number} */
    var i = 0;
    var n = regexs.length;
    for (;i < n;++i) {
      var regex = regexs[i];
      if (regex.ignoreCase) {
        /** @type {boolean} */
        ignoreCase = true;
      } else {
        if (/[a-z]/i.test(regex.source.replace(/\\u[0-9a-f]{4}|\\x[0-9a-f]{2}|\\[^ux]/gi, ""))) {
          /** @type {boolean} */
          needToFoldCase = true;
          /** @type {boolean} */
          ignoreCase = false;
          break;
        }
      }
    }
    var escapeCharToCodeUnit = {
      "b" : 8,
      "t" : 9,
      "n" : 10,
      "v" : 11,
      "f" : 12,
      "r" : 13
    };
    /** @type {Array} */
    var tagNameArr = [];
    /** @type {number} */
    i = 0;
    n = regexs.length;
    for (;i < n;++i) {
      regex = regexs[i];
      if (regex.global || regex.multiline) {
        throw new Error("" + regex);
      }
      tagNameArr.push("(?:" + allowAnywhereFoldCaseAndRenumberGroups(regex) + ")");
    }
    return new RegExp(tagNameArr.join("|"), ignoreCase ? "gi" : "g");
  }
  /**
   * @param {Node} node
   * @param {?} isPreformatted
   * @return {?}
   */
  function extractSourceSpans(node, isPreformatted) {
    /**
     * @param {Node} node
     * @return {undefined}
     */
    function walk(node) {
      switch(node.nodeType) {
        case 1:
          if (nocode.test(node.className)) {
            return;
          }
          var child = node.firstChild;
          for (;child;child = child.nextSibling) {
            walk(child);
          }
          var nodeName = node.nodeName.toLowerCase();
          if ("br" === nodeName || "li" === nodeName) {
            /** @type {string} */
            chunks[k] = "\n";
            /** @type {number} */
            spans[k << 1] = length++;
            /** @type {Node} */
            spans[k++ << 1 | 1] = node;
          }
          break;
        case 3:
        ;
        case 4:
          var text = node.nodeValue;
          if (text.length) {
            if (!isPreformatted) {
              text = text.replace(/[ \t\r\n]+/g, " ");
            } else {
              text = text.replace(/\r\n?/g, "\n");
            }
            chunks[k] = text;
            spans[k << 1] = length;
            length += text.length;
            /** @type {Node} */
            spans[k++ << 1 | 1] = node;
          }
          break;
      }
    }
    /** @type {RegExp} */
    var nocode = /(?:^|\s)nocode(?:\s|$)/;
    /** @type {Array} */
    var chunks = [];
    /** @type {number} */
    var length = 0;
    /** @type {Array} */
    var spans = [];
    /** @type {number} */
    var k = 0;
    walk(node);
    return{
      sourceCode : chunks.join("").replace(/\n$/, ""),
      spans : spans
    };
  }
  /**
   * @param {number} basePos
   * @param {string} sourceCode
   * @param {Function} langHandler
   * @param {Array} out
   * @return {undefined}
   */
  function appendDecorations(basePos, sourceCode, langHandler, out) {
    if (!sourceCode) {
      return;
    }
    var job = {
      sourceCode : sourceCode,
      basePos : basePos
    };
    langHandler(job);
    out.push.apply(out, job.decorations);
  }
  /**
   * @param {Object} element
   * @return {?}
   */
  function childContentWrapper(element) {
    var wrapper = undefined;
    var c = element.firstChild;
    for (;c;c = c.nextSibling) {
      var type = c.nodeType;
      wrapper = type === 1 ? wrapper ? element : c : type === 3 ? notWs.test(c.nodeValue) ? element : wrapper : wrapper;
    }
    return wrapper === element ? undefined : wrapper;
  }
  /**
   * @param {Array} shortcutStylePatterns
   * @param {Array} fallthroughStylePatterns
   * @return {?}
   */
  function createSimpleLexer(shortcutStylePatterns, fallthroughStylePatterns) {
    var shortcuts = {};
    var tokenizer;
    (function() {
      var allPatterns = shortcutStylePatterns.concat(fallthroughStylePatterns);
      /** @type {Array} */
      var allRegexs = [];
      var regexKeys = {};
      /** @type {number} */
      var i = 0;
      var n = allPatterns.length;
      for (;i < n;++i) {
        var patternParts = allPatterns[i];
        var shortcutChars = patternParts[3];
        if (shortcutChars) {
          var c = shortcutChars.length;
          for (;--c >= 0;) {
            shortcuts[shortcutChars.charAt(c)] = patternParts;
          }
        }
        var regex = patternParts[1];
        /** @type {string} */
        var k = "" + regex;
        if (!regexKeys.hasOwnProperty(k)) {
          allRegexs.push(regex);
          /** @type {null} */
          regexKeys[k] = null;
        }
      }
      allRegexs.push(/[\0-\uffff]/);
      tokenizer = combinePrefixPatterns(allRegexs);
    })();
    var valuesLen = fallthroughStylePatterns.length;
    /**
     * @param {Object} job
     * @return {undefined}
     */
    var decorate = function(job) {
      var sourceCode = job.sourceCode;
      var basePos = job.basePos;
      /** @type {Array} */
      var decorations = [basePos, PR_PLAIN];
      /** @type {number} */
      var pos = 0;
      var tokens = sourceCode.match(tokenizer) || [];
      var styleCache = {};
      /** @type {number} */
      var ti = 0;
      var nTokens = tokens.length;
      for (;ti < nTokens;++ti) {
        var token = tokens[ti];
        var style = styleCache[token];
        var match = void 0;
        var isEmbedded;
        if (typeof style === "string") {
          /** @type {boolean} */
          isEmbedded = false;
        } else {
          var patternParts = shortcuts[token.charAt(0)];
          if (patternParts) {
            match = token.match(patternParts[1]);
            style = patternParts[0];
          } else {
            /** @type {number} */
            var i = 0;
            for (;i < valuesLen;++i) {
              patternParts = fallthroughStylePatterns[i];
              match = token.match(patternParts[1]);
              if (match) {
                style = patternParts[0];
                break;
              }
            }
            if (!match) {
              /** @type {string} */
              style = PR_PLAIN;
            }
          }
          /** @type {boolean} */
          isEmbedded = style.length >= 5 && "lang-" === style.substring(0, 5);
          if (isEmbedded && !(match && typeof match[1] === "string")) {
            /** @type {boolean} */
            isEmbedded = false;
            /** @type {string} */
            style = PR_SOURCE;
          }
          if (!isEmbedded) {
            styleCache[token] = style;
          }
        }
        var tokenStart = pos;
        pos += token.length;
        if (!isEmbedded) {
          decorations.push(basePos + tokenStart, style);
        } else {
          var embeddedSource = match[1];
          var embeddedSourceStart = token.indexOf(embeddedSource);
          var embeddedSourceEnd = embeddedSourceStart + embeddedSource.length;
          if (match[2]) {
            /** @type {number} */
            embeddedSourceEnd = token.length - match[2].length;
            /** @type {number} */
            embeddedSourceStart = embeddedSourceEnd - embeddedSource.length;
          }
          var lang = style.substring(5);
          appendDecorations(basePos + tokenStart, token.substring(0, embeddedSourceStart), decorate, decorations);
          appendDecorations(basePos + tokenStart + embeddedSourceStart, embeddedSource, langHandlerForExtension(lang, embeddedSource), decorations);
          appendDecorations(basePos + tokenStart + embeddedSourceEnd, token.substring(embeddedSourceEnd), decorate, decorations);
        }
      }
      /** @type {Array} */
      job.decorations = decorations;
    };
    return decorate;
  }
  /**
   * @param {Object} options
   * @return {?}
   */
  function sourceDecorator(options) {
    /** @type {Array} */
    var shortcutStylePatterns = [];
    /** @type {Array} */
    var fallthroughStylePatterns = [];
    if (options["tripleQuotedStrings"]) {
      shortcutStylePatterns.push([PR_STRING, /^(?:\'\'\'(?:[^\'\\]|\\[\s\S]|\'{1,2}(?=[^\']))*(?:\'\'\'|$)|\"\"\"(?:[^\"\\]|\\[\s\S]|\"{1,2}(?=[^\"]))*(?:\"\"\"|$)|\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$))/, null, "'\""]);
    } else {
      if (options["multiLineStrings"]) {
        shortcutStylePatterns.push([PR_STRING, /^(?:\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$)|\`(?:[^\\\`]|\\[\s\S])*(?:\`|$))/, null, "'\"`"]);
      } else {
        shortcutStylePatterns.push([PR_STRING, /^(?:\'(?:[^\\\'\r\n]|\\.)*(?:\'|$)|\"(?:[^\\\"\r\n]|\\.)*(?:\"|$))/, null, "\"'"]);
      }
    }
    if (options["verbatimStrings"]) {
      fallthroughStylePatterns.push([PR_STRING, /^@\"(?:[^\"]|\"\")*(?:\"|$)/, null]);
    }
    var hc = options["hashComments"];
    if (hc) {
      if (options["cStyleComments"]) {
        if (hc > 1) {
          shortcutStylePatterns.push([PR_COMMENT, /^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/, null, "#"]);
        } else {
          shortcutStylePatterns.push([PR_COMMENT, /^#(?:(?:define|e(?:l|nd)if|else|error|ifn?def|include|line|pragma|undef|warning)\b|[^\r\n]*)/, null, "#"]);
        }
        fallthroughStylePatterns.push([PR_STRING, /^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h(?:h|pp|\+\+)?|[a-z]\w*)>/, null]);
      } else {
        shortcutStylePatterns.push([PR_COMMENT, /^#[^\r\n]*/, null, "#"]);
      }
    }
    if (options["cStyleComments"]) {
      fallthroughStylePatterns.push([PR_COMMENT, /^\/\/[^\r\n]*/, null]);
      fallthroughStylePatterns.push([PR_COMMENT, /^\/\*[\s\S]*?(?:\*\/|$)/, null]);
    }
    if (options["regexLiterals"]) {
      /** @type {string} */
      var REGEX_LITERAL = "/(?=[^/*])" + "(?:[^/\\x5B\\x5C]" + "|\\x5C[\\s\\S]" + "|\\x5B(?:[^\\x5C\\x5D]|\\x5C[\\s\\S])*(?:\\x5D|$))+" + "/";
      fallthroughStylePatterns.push(["lang-regex", new RegExp("^" + REGEXP_PRECEDER_PATTERN + "(" + REGEX_LITERAL + ")")]);
    }
    var types = options["types"];
    if (types) {
      fallthroughStylePatterns.push([PR_TYPE, types]);
    }
    var keywords = ("" + options["keywords"]).replace(/^ | $/g, "");
    if (keywords.length) {
      fallthroughStylePatterns.push([PR_KEYWORD, new RegExp("^(?:" + keywords.replace(/[\s,]+/g, "|") + ")\\b"), null]);
    }
    shortcutStylePatterns.push([PR_PLAIN, /^\s+/, null, " \r\n\t\u00a0"]);
    /** @type {RegExp} */
    var punctuation = /^.[^\s\w\.$@\'\"\`\/\\]*/;
    fallthroughStylePatterns.push([PR_LITERAL, /^@[a-z_$][a-z_$@0-9]*/i, null], [PR_TYPE, /^(?:[@_]?[A-Z]+[a-z][A-Za-z_$@0-9]*|\w+_t\b)/, null], [PR_PLAIN, /^[a-z_$][a-z_$@0-9]*/i, null], [PR_LITERAL, new RegExp("^(?:" + "0x[a-f0-9]+" + "|(?:\\d(?:_\\d+)*\\d*(?:\\.\\d*)?|\\.\\d\\+)" + "(?:e[+\\-]?\\d+)?" + ")" + "[a-z]*", "i"), null, "0123456789"], [PR_PLAIN, /^\\[\s\S]?/, null], [PR_PUNCTUATION, punctuation, null]);
    return createSimpleLexer(shortcutStylePatterns, fallthroughStylePatterns);
  }
  /**
   * @param {Node} node
   * @param {number} opt_startLineNum
   * @param {boolean} isPreformatted
   * @return {undefined}
   */
  function numberLines(node, opt_startLineNum, isPreformatted) {
    /**
     * @param {Node} node
     * @return {undefined}
     */
    function walk(node) {
      switch(node.nodeType) {
        case 1:
          if (nocode.test(node.className)) {
            break;
          }
          if ("br" === node.nodeName) {
            breakAfter(node);
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          } else {
            var child = node.firstChild;
            for (;child;child = child.nextSibling) {
              walk(child);
            }
          }
          break;
        case 3:
        ;
        case 4:
          if (isPreformatted) {
            var text = node.nodeValue;
            var match = text.match(lineBreak);
            if (match) {
              var firstLine = text.substring(0, match.index);
              node.nodeValue = firstLine;
              var tail = text.substring(match.index + match[0].length);
              if (tail) {
                var parent = node.parentNode;
                parent.insertBefore(document.createTextNode(tail), node.nextSibling);
              }
              breakAfter(node);
              if (!firstLine) {
                node.parentNode.removeChild(node);
              }
            }
          }
          break;
      }
    }
    /**
     * @param {Element} lineEndNode
     * @return {undefined}
     */
    function breakAfter(lineEndNode) {
      /**
       * @param {Object} limit
       * @param {number} copy
       * @return {?}
       */
      function breakLeftOf(limit, copy) {
        var rightSide = copy ? limit.cloneNode(false) : limit;
        var parent = limit.parentNode;
        if (parent) {
          var parentClone = breakLeftOf(parent, 1);
          var next = limit.nextSibling;
          parentClone.appendChild(rightSide);
          var sibling = next;
          for (;sibling;sibling = next) {
            next = sibling.nextSibling;
            parentClone.appendChild(sibling);
          }
        }
        return rightSide;
      }
      for (;!lineEndNode.nextSibling;) {
        lineEndNode = lineEndNode.parentNode;
        if (!lineEndNode) {
          return;
        }
      }
      var copiedListItem = breakLeftOf(lineEndNode.nextSibling, 0);
      var parent;
      for (;(parent = copiedListItem.parentNode) && parent.nodeType === 1;) {
        copiedListItem = parent;
      }
      listItems.push(copiedListItem);
    }
    /** @type {RegExp} */
    var nocode = /(?:^|\s)nocode(?:\s|$)/;
    /** @type {RegExp} */
    var lineBreak = /\r\n?|\n/;
    var document = node.ownerDocument;
    var li = document.createElement("li");
    for (;node.firstChild;) {
      li.appendChild(node.firstChild);
    }
    /** @type {Array} */
    var listItems = [li];
    /** @type {number} */
    var i = 0;
    for (;i < listItems.length;++i) {
      walk(listItems[i]);
    }
    if (opt_startLineNum === (opt_startLineNum | 0)) {
      listItems[0].setAttribute("value", opt_startLineNum);
    }
    var ol = document.createElement("ol");
    /** @type {string} */
    ol.className = "linenums";
    /** @type {number} */
    var offset = Math.max(0, opt_startLineNum - 1 | 0) || 0;
    /** @type {number} */
    i = 0;
    /** @type {number} */
    var n = listItems.length;
    for (;i < n;++i) {
      li = listItems[i];
      /** @type {string} */
      li.className = "L" + (i + offset) % 10;
      if (!li.firstChild) {
        li.appendChild(document.createTextNode("\u00a0"));
      }
      ol.appendChild(li);
    }
    node.appendChild(ol);
  }
  /**
   * @param {Object} job
   * @return {undefined}
   */
  function recombineTagsAndDecorations(job) {
    /** @type {(Array.<string>|null)} */
    var skipStatic = /\bMSIE\s(\d+)/.exec(navigator.userAgent);
    /** @type {(boolean|null)} */
    skipStatic = skipStatic && +skipStatic[1] <= 8;
    /** @type {RegExp} */
    var newlineRe = /\n/g;
    var source = job.sourceCode;
    var sourceLength = source.length;
    /** @type {number} */
    var sourceIndex = 0;
    var spans = job.spans;
    var nSpans = spans.length;
    /** @type {number} */
    var spanIndex = 0;
    var decorations = job.decorations;
    var nDecorations = decorations.length;
    /** @type {number} */
    var decorationIndex = 0;
    decorations[nDecorations] = sourceLength;
    var decPos;
    var i;
    /** @type {number} */
    i = decPos = 0;
    for (;i < nDecorations;) {
      if (decorations[i] !== decorations[i + 2]) {
        decorations[decPos++] = decorations[i++];
        decorations[decPos++] = decorations[i++];
      } else {
        i += 2;
      }
    }
    /** @type {number} */
    nDecorations = decPos;
    /** @type {number} */
    i = decPos = 0;
    for (;i < nDecorations;) {
      var startPos = decorations[i];
      var startDec = decorations[i + 1];
      /** @type {number} */
      var end = i + 2;
      for (;end + 2 <= nDecorations && decorations[end + 1] === startDec;) {
        end += 2;
      }
      decorations[decPos++] = startPos;
      decorations[decPos++] = startDec;
      /** @type {number} */
      i = end;
    }
    /** @type {number} */
    nDecorations = decorations.length = decPos;
    var sourceNode = job.sourceNode;
    var oldDisplay;
    if (sourceNode) {
      oldDisplay = sourceNode.style.display;
      /** @type {string} */
      sourceNode.style.display = "none";
    }
    try {
      /** @type {null} */
      var decoration = null;
      for (;spanIndex < nSpans;) {
        var spanStart = spans[spanIndex];
        var spanEnd = spans[spanIndex + 2] || sourceLength;
        var decEnd = decorations[decorationIndex + 2] || sourceLength;
        /** @type {number} */
        end = Math.min(spanEnd, decEnd);
        var textNode = spans[spanIndex + 1];
        var styledText;
        if (textNode.nodeType !== 1 && (styledText = source.substring(sourceIndex, end))) {
          if (skipStatic) {
            styledText = styledText.replace(newlineRe, "\r");
          }
          textNode.nodeValue = styledText;
          var document = textNode.ownerDocument;
          var span = document.createElement("span");
          span.className = decorations[decorationIndex + 1];
          var parentNode = textNode.parentNode;
          parentNode.replaceChild(span, textNode);
          span.appendChild(textNode);
          if (sourceIndex < spanEnd) {
            spans[spanIndex + 1] = textNode = document.createTextNode(source.substring(end, spanEnd));
            parentNode.insertBefore(textNode, span.nextSibling);
          }
        }
        /** @type {number} */
        sourceIndex = end;
        if (sourceIndex >= spanEnd) {
          spanIndex += 2;
        }
        if (sourceIndex >= decEnd) {
          decorationIndex += 2;
        }
      }
    } finally {
      if (sourceNode) {
        sourceNode.style.display = oldDisplay;
      }
    }
  }
  /**
   * @param {?} handler
   * @param {Array} fileExtensions
   * @return {undefined}
   */
  function registerLangHandler(handler, fileExtensions) {
    var i = fileExtensions.length;
    for (;--i >= 0;) {
      var ext = fileExtensions[i];
      if (!langHandlerRegistry.hasOwnProperty(ext)) {
        langHandlerRegistry[ext] = handler;
      } else {
        if (win["console"]) {
          console["warn"]("cannot override language handler %s", ext);
        }
      }
    }
  }
  /**
   * @param {string} extension
   * @param {?} source
   * @return {?}
   */
  function langHandlerForExtension(extension, source) {
    if (!(extension && langHandlerRegistry.hasOwnProperty(extension))) {
      /** @type {string} */
      extension = /^\s*</.test(source) ? "default-markup" : "default-code";
    }
    return langHandlerRegistry[extension];
  }
  /**
   * @param {Object} job
   * @return {undefined}
   */
  function applyDecorator(job) {
    var opt_langExtension = job.langExtension;
    try {
      var sourceAndSpans = extractSourceSpans(job.sourceNode, job.pre);
      var source = sourceAndSpans.sourceCode;
      job.sourceCode = source;
      job.spans = sourceAndSpans.spans;
      /** @type {number} */
      job.basePos = 0;
      langHandlerForExtension(opt_langExtension, source)(job);
      recombineTagsAndDecorations(job);
    } catch (e) {
      if (win["console"]) {
        console["log"](e && e["stack"] ? e["stack"] : e);
      }
    }
  }
  /**
   * @param {string} sourceCodeHtml
   * @param {(Array|number)} opt_langExtension
   * @param {string} opt_numberLines
   * @return {?}
   */
  function prettyPrintOne(sourceCodeHtml, opt_langExtension, opt_numberLines) {
    /** @type {Element} */
    var container = document.createElement("pre");
    /** @type {string} */
    container.innerHTML = sourceCodeHtml;
    if (opt_numberLines) {
      numberLines(container, opt_numberLines, true);
    }
    var job = {
      langExtension : opt_langExtension,
      numberLines : opt_numberLines,
      sourceNode : container,
      pre : 1
    };
    applyDecorator(job);
    return container.innerHTML;
  }
  /**
   * @param {?} opt_whenDone
   * @return {undefined}
   */
  function prettyPrint(opt_whenDone) {
    /**
     * @param {string} tn
     * @return {?}
     */
    function byTagName(tn) {
      return document.getElementsByTagName(tn);
    }
    /**
     * @return {undefined}
     */
    function doWork() {
      var endTime = win["PR_SHOULD_USE_CONTINUATION"] ? clock["now"]() + 250 : Infinity;
      for (;k < elements.length && clock["now"]() < endTime;k++) {
        var cs = elements[k];
        var className = cs.className;
        if (prettyPrintRe.test(className) && !classNameFilter.test(className)) {
          /** @type {boolean} */
          var nested = false;
          var p = cs.parentNode;
          for (;p;p = p.parentNode) {
            var tn = p.tagName;
            if (preCodeXmpRe.test(tn) && (p.className && prettyPrintRe.test(p.className))) {
              /** @type {boolean} */
              nested = true;
              break;
            }
          }
          if (!nested) {
            cs.className += " prettyprinted";
            var langExtension = className.match(langExtensionRe);
            var wrapper;
            if (!langExtension && ((wrapper = childContentWrapper(cs)) && rchecked.test(wrapper.tagName))) {
              langExtension = wrapper.className.match(langExtensionRe);
            }
            if (langExtension) {
              langExtension = langExtension[1];
            }
            var preformatted;
            if (preformattedTagNameRe.test(cs.tagName)) {
              /** @type {number} */
              preformatted = 1;
            } else {
              var currentStyle = cs["currentStyle"];
              var whitespace = currentStyle ? currentStyle["whiteSpace"] : document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(cs, null).getPropertyValue("white-space") : 0;
              preformatted = whitespace && "pre" === whitespace.substring(0, 3);
            }
            /** @type {(Array.<string>|null)} */
            var lineNums = cs.className.match(/\blinenums\b(?::(\d+))?/);
            /** @type {(boolean|number)} */
            lineNums = lineNums ? lineNums[1] && lineNums[1].length ? +lineNums[1] : true : false;
            if (lineNums) {
              numberLines(cs, lineNums, preformatted);
            }
            prettyPrintingJob = {
              langExtension : langExtension,
              sourceNode : cs,
              numberLines : lineNums,
              pre : preformatted
            };
            applyDecorator(prettyPrintingJob);
          }
        }
      }
      if (k < elements.length) {
        setTimeout(doWork, 250);
      } else {
        if (opt_whenDone) {
          opt_whenDone();
        }
      }
    }
    /** @type {Array} */
    var codeSegments = [byTagName("pre"), byTagName("code"), byTagName("xmp")];
    /** @type {Array} */
    var elements = [];
    /** @type {number} */
    var i = 0;
    for (;i < codeSegments.length;++i) {
      /** @type {number} */
      var j = 0;
      var jl = codeSegments[i].length;
      for (;j < jl;++j) {
        elements.push(codeSegments[i][j]);
      }
    }
    /** @type {null} */
    codeSegments = null;
    /** @type {function (new:Date, ?=, ?=, ?=, ?=, ?=, ?=, ?=): string} */
    var clock = Date;
    if (!clock["now"]) {
      clock = {
        /**
         * @return {?}
         */
        "now" : function() {
          return+new Date;
        }
      };
    }
    /** @type {number} */
    var k = 0;
    var prettyPrintingJob;
    /** @type {RegExp} */
    var langExtensionRe = /\blang(?:uage)?-([\w.]+)(?!\S)/;
    /** @type {RegExp} */
    var prettyPrintRe = /\bprettyprint\b/;
    /** @type {RegExp} */
    var classNameFilter = /\bprettyprinted\b/;
    /** @type {RegExp} */
    var preformattedTagNameRe = /pre|xmp/i;
    /** @type {RegExp} */
    var rchecked = /^code$/i;
    /** @type {RegExp} */
    var preCodeXmpRe = /^(?:pre|code|xmp)$/i;
    doWork();
  }
  /** @type {Window} */
  var win = window;
  /** @type {Array} */
  var FLOW_CONTROL_KEYWORDS = ["break,continue,do,else,for,if,return,while"];
  /** @type {Array} */
  var C_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "auto,case,char,const,default," + "double,enum,extern,float,goto,int,long,register,short,signed,sizeof," + "static,struct,switch,typedef,union,unsigned,void,volatile"];
  /** @type {Array} */
  var COMMON_KEYWORDS = [C_KEYWORDS, "catch,class,delete,false,import," + "new,operator,private,protected,public,this,throw,true,try,typeof"];
  /** @type {Array} */
  var CPP_KEYWORDS = [COMMON_KEYWORDS, "alignof,align_union,asm,axiom,bool," + "concept,concept_map,const_cast,constexpr,decltype," + "dynamic_cast,explicit,export,friend,inline,late_check," + "mutable,namespace,nullptr,reinterpret_cast,static_assert,static_cast," + "template,typeid,typename,using,virtual,where"];
  /** @type {Array} */
  var JAVA_KEYWORDS = [COMMON_KEYWORDS, "abstract,boolean,byte,extends,final,finally,implements,import," + "instanceof,null,native,package,strictfp,super,synchronized,throws," + "transient"];
  /** @type {Array} */
  var CSHARP_KEYWORDS = [JAVA_KEYWORDS, "as,base,by,checked,decimal,delegate,descending,dynamic,event," + "fixed,foreach,from,group,implicit,in,interface,internal,into,is,let," + "lock,object,out,override,orderby,params,partial,readonly,ref,sbyte," + "sealed,stackalloc,string,select,uint,ulong,unchecked,unsafe,ushort," + "var,virtual,where"];
  /** @type {string} */
  var COFFEE_KEYWORDS = "all,and,by,catch,class,else,extends,false,finally," + "for,if,in,is,isnt,loop,new,no,not,null,of,off,on,or,return,super,then," + "throw,true,try,unless,until,when,while,yes";
  /** @type {Array} */
  var JSCRIPT_KEYWORDS = [COMMON_KEYWORDS, "debugger,eval,export,function,get,null,set,undefined,var,with," + "Infinity,NaN"];
  /** @type {string} */
  var PERL_KEYWORDS = "caller,delete,die,do,dump,elsif,eval,exit,foreach,for," + "goto,if,import,last,local,my,next,no,our,print,package,redo,require," + "sub,undef,unless,until,use,wantarray,while,BEGIN,END";
  /** @type {Array} */
  var PYTHON_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "and,as,assert,class,def,del," + "elif,except,exec,finally,from,global,import,in,is,lambda," + "nonlocal,not,or,pass,print,raise,try,with,yield," + "False,True,None"];
  /** @type {Array} */
  var RUBY_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "alias,and,begin,case,class," + "def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,redo," + "rescue,retry,self,super,then,true,undef,unless,until,when,yield," + "BEGIN,END"];
  /** @type {Array} */
  var SH_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "case,done,elif,esac,eval,fi," + "function,in,local,set,then,until"];
  /** @type {Array} */
  var ALL_KEYWORDS = [CPP_KEYWORDS, CSHARP_KEYWORDS, JSCRIPT_KEYWORDS, PERL_KEYWORDS + PYTHON_KEYWORDS, RUBY_KEYWORDS, SH_KEYWORDS];
  /** @type {RegExp} */
  var C_TYPES = /^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)\b/;
  /** @type {string} */
  var PR_STRING = "str";
  /** @type {string} */
  var PR_KEYWORD = "kwd";
  /** @type {string} */
  var PR_COMMENT = "com";
  /** @type {string} */
  var PR_TYPE = "typ";
  /** @type {string} */
  var PR_LITERAL = "lit";
  /** @type {string} */
  var PR_PUNCTUATION = "pun";
  /** @type {string} */
  var PR_PLAIN = "pln";
  /** @type {string} */
  var PR_TAG = "tag";
  /** @type {string} */
  var PR_DECLARATION = "dec";
  /** @type {string} */
  var PR_SOURCE = "src";
  /** @type {string} */
  var PR_ATTRIB_NAME = "atn";
  /** @type {string} */
  var PR_ATTRIB_VALUE = "atv";
  /** @type {string} */
  var PR_NOCODE = "nocode";
  /** @type {string} */
  var REGEXP_PRECEDER_PATTERN = "(?:^^\\.?|[+-]|[!=]=?=?|\\#|%=?|&&?=?|\\(|\\*=?|[+\\-]=|->|\\/=?|::?|<<?=?|>>?>?=?|,|;|\\?|@|\\[|~|{|\\^\\^?=?|\\|\\|?=?|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\\s*";
  /** @type {RegExp} */
  var notWs = /\S/;
  var decorateSource = sourceDecorator({
    "keywords" : ALL_KEYWORDS,
    "hashComments" : true,
    "cStyleComments" : true,
    "multiLineStrings" : true,
    "regexLiterals" : true
  });
  var langHandlerRegistry = {};
  registerLangHandler(decorateSource, ["default-code"]);
  registerLangHandler(createSimpleLexer([], [[PR_PLAIN, /^[^<?]+/], [PR_DECLARATION, /^<!\w[^>]*(?:>|$)/], [PR_COMMENT, /^<\!--[\s\S]*?(?:-\->|$)/], ["lang-", /^<\?([\s\S]+?)(?:\?>|$)/], ["lang-", /^<%([\s\S]+?)(?:%>|$)/], [PR_PUNCTUATION, /^(?:<[%?]|[%?]>)/], ["lang-", /^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i], ["lang-js", /^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i], ["lang-css", /^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i], ["lang-in.tag", /^(<\/?[a-z][^<>]*>)/i]]), ["default-markup", 
  "htm", "html", "mxml", "xhtml", "xml", "xsl"]);
  registerLangHandler(createSimpleLexer([[PR_PLAIN, /^[\s]+/, null, " \t\r\n"], [PR_ATTRIB_VALUE, /^(?:\"[^\"]*\"?|\'[^\']*\'?)/, null, "\"'"]], [[PR_TAG, /^^<\/?[a-z](?:[\w.:-]*\w)?|\/?>$/i], [PR_ATTRIB_NAME, /^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i], ["lang-uq.val", /^=\s*([^>\'\"\s]*(?:[^>\'\"\s\/]|\/(?=\s)))/], [PR_PUNCTUATION, /^[=<>\/]+/], ["lang-js", /^on\w+\s*=\s*\"([^\"]+)\"/i], ["lang-js", /^on\w+\s*=\s*\'([^\']+)\'/i], ["lang-js", /^on\w+\s*=\s*([^\"\'>\s]+)/i], ["lang-css", /^style\s*=\s*\"([^\"]+)\"/i], 
  ["lang-css", /^style\s*=\s*\'([^\']+)\'/i], ["lang-css", /^style\s*=\s*([^\"\'>\s]+)/i]]), ["in.tag"]);
  registerLangHandler(createSimpleLexer([], [[PR_ATTRIB_VALUE, /^[\s\S]+/]]), ["uq.val"]);
  registerLangHandler(sourceDecorator({
    "keywords" : CPP_KEYWORDS,
    "hashComments" : true,
    "cStyleComments" : true,
    "types" : C_TYPES
  }), ["c", "cc", "cpp", "cxx", "cyc", "m"]);
  registerLangHandler(sourceDecorator({
    "keywords" : "null,true,false"
  }), ["json"]);
  registerLangHandler(sourceDecorator({
    "keywords" : CSHARP_KEYWORDS,
    "hashComments" : true,
    "cStyleComments" : true,
    "verbatimStrings" : true,
    "types" : C_TYPES
  }), ["cs"]);
  registerLangHandler(sourceDecorator({
    "keywords" : JAVA_KEYWORDS,
    "cStyleComments" : true
  }), ["java"]);
  registerLangHandler(sourceDecorator({
    "keywords" : SH_KEYWORDS,
    "hashComments" : true,
    "multiLineStrings" : true
  }), ["bsh", "csh", "sh"]);
  registerLangHandler(sourceDecorator({
    "keywords" : PYTHON_KEYWORDS,
    "hashComments" : true,
    "multiLineStrings" : true,
    "tripleQuotedStrings" : true
  }), ["cv", "py"]);
  registerLangHandler(sourceDecorator({
    "keywords" : PERL_KEYWORDS,
    "hashComments" : true,
    "multiLineStrings" : true,
    "regexLiterals" : true
  }), ["perl", "pl", "pm"]);
  registerLangHandler(sourceDecorator({
    "keywords" : RUBY_KEYWORDS,
    "hashComments" : true,
    "multiLineStrings" : true,
    "regexLiterals" : true
  }), ["rb"]);
  registerLangHandler(sourceDecorator({
    "keywords" : JSCRIPT_KEYWORDS,
    "cStyleComments" : true,
    "regexLiterals" : true
  }), ["js"]);
  registerLangHandler(sourceDecorator({
    "keywords" : COFFEE_KEYWORDS,
    "hashComments" : 3,
    "cStyleComments" : true,
    "multilineStrings" : true,
    "tripleQuotedStrings" : true,
    "regexLiterals" : true
  }), ["coffee"]);
  registerLangHandler(createSimpleLexer([], [[PR_STRING, /^[\s\S]+/]]), ["regex"]);
  var PR = win["PR"] = {
    /** @type {function (Array, Array): ?} */
    "createSimpleLexer" : createSimpleLexer,
    /** @type {function (?, Array): undefined} */
    "registerLangHandler" : registerLangHandler,
    /** @type {function (Object): ?} */
    "sourceDecorator" : sourceDecorator,
    "PR_ATTRIB_NAME" : PR_ATTRIB_NAME,
    "PR_ATTRIB_VALUE" : PR_ATTRIB_VALUE,
    "PR_COMMENT" : PR_COMMENT,
    "PR_DECLARATION" : PR_DECLARATION,
    "PR_KEYWORD" : PR_KEYWORD,
    "PR_LITERAL" : PR_LITERAL,
    "PR_NOCODE" : PR_NOCODE,
    "PR_PLAIN" : PR_PLAIN,
    "PR_PUNCTUATION" : PR_PUNCTUATION,
    "PR_SOURCE" : PR_SOURCE,
    "PR_STRING" : PR_STRING,
    "PR_TAG" : PR_TAG,
    "PR_TYPE" : PR_TYPE,
    /** @type {function (string, (Array|number), string): ?} */
    "prettyPrintOne" : win["prettyPrintOne"] = prettyPrintOne,
    /** @type {function (?): undefined} */
    "prettyPrint" : win["prettyPrint"] = prettyPrint
  };
  if (typeof define === "function" && define["amd"]) {
    define("google-code-prettify", [], function() {
      return PR;
    });
  }
})();
(function(window, document) {
  /**
   * @param {string} url
   * @return {?}
   */
  function parseURL(url) {
    /** @type {Element} */
    var anchor = document.createElement("a");
    var ret = {};
    var codeSegments;
    var b;
    var i;
    /** @type {string} */
    anchor.href = url;
    codeSegments = anchor.search.replace("?", "&").split("&");
    /** @type {number} */
    i = 0;
    for (;i < codeSegments.length;i++) {
      b = codeSegments[i].split("=");
      if (b[0]) {
        ret[b[0]] = b[1] || "";
      }
    }
    return ret;
  }
  /** @type {string} */
  document.body.style.display = "none";
  document.head = document.getElementsByTagName("head")[0];
  if (!("getElementsByClassName" in document)) {
    /**
     * @param {string} name
     * @return {NodeList}
     */
    document.getElementsByClassName = function(name) {
      /**
       * @param {Object} node
       * @param {string} keepData
       * @return {?}
       */
      function getElementsByClassName(node, keepData) {
        /** @type {Array} */
        var a = [];
        /** @type {RegExp} */
        var nocode = new RegExp("(^| )" + keepData + "( |$)");
        var els = node.getElementsByTagName("*");
        /** @type {number} */
        var i = 0;
        var len = els.length;
        for (;i < len;i++) {
          if (nocode.test(els[i].className)) {
            a.push(els[i]);
          }
        }
        return a;
      }
      return getElementsByClassName(document.body, name);
    };
  }
  var markdownEl = document.getElementsByTagName("xmp")[0] || (document.getElementsByTagName("pre")[0] || document.getElementsByTagName("textarea")[0]);
  var a = document.getElementsByTagName("title")[0];
  /** @type {NodeList} */
  var codeSegments = document.getElementsByTagName("script");
  var u = document.getElementsByClassName("navbar")[0];
  /** @type {Element} */
  var metaEl = document.createElement("meta");
  /** @type {string} */
  metaEl.name = "viewport";
  /** @type {string} */
  metaEl.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0";
  if (document.head.firstChild) {
    document.head.insertBefore(metaEl, document.head.firstChild);
  } else {
    document.head.appendChild(metaEl);
  }
  /** @type {string} */
  var url = "";
  /** @type {number} */
  var i = 0;
  for (;i < codeSegments.length;i++) {
    if (codeSegments[i].src.match("strapdown")) {
      url = codeSegments[i].src;
    }
  }
  var path = url.substr(0, url.lastIndexOf("/"));
  var fmt = parseURL(url);
  console.log(fmt);
  console.log("[strapdown.js] [INFO] search the URI for src = " + fmt["src"]);
  var name = markdownEl.getAttribute("theme") || (fmt["theme"] || "united");
  name = name.toLowerCase();
  console.log("[strapdown.js] [INFO] Parser and lexer well imported. Origin = " + url + "\n Theme = " + name);
  /** @type {Element} */
  var node = document.createElement("link");
  /** @type {string} */
  node.rel = "stylesheet";
  /** @type {string} */
  node.href = path + "/themes/" + name + ".min.css";
  document.head.appendChild(node);
  /** @type {Element} */
  node = document.createElement("link");
  /** @type {string} */
  node.rel = "stylesheet";
  /** @type {string} */
  node.href = path + "/strapdown.min.css";
  document.head.appendChild(node);
  /** @type {Element} */
  node = document.createElement("link");
  /** @type {string} */
  node.rel = "stylesheet";
  /** @type {string} */
  node.href = path + "/themes/bootstrap-responsive.min.css";
  document.head.appendChild(node);
  /** @type {Element} */
  node = document.createElement("link");
  /** @type {string} */
  node.rel = "shortcut icon";
  /** @type {string} */
  node.href = path + "/favicon.png";
  document.head.appendChild(node);
  var markdown = markdownEl.textContent || markdownEl.innerText;
  /** @type {Element} */
  var newNode = document.createElement("div");
  /** @type {string} */
  newNode.className = "container";
  /** @type {string} */
  newNode.id = "content";
  document.body.replaceChild(newNode, markdownEl);
  /** @type {Element} */
  newNode = document.createElement("div");
  /** @type {string} */
  newNode.className = "navbar navbar-fixed-top";
  if (!u && a) {
    /** @type {string} */
    newNode.innerHTML = '<div class="navbar-inner"> <div class="container"> <div id="headline" class="brand"> </div> ' + '<div id="headline-copyrights" class="brand">(' + '<a title="http://lbo.k.vu/md" href="http://lbesson.bitbucket.org/md/index.html?src=strapdown.js">StrapDown.js</a> v0.5, ' + 'theme <a title="More information on this theme on bootswatch.com!" href="http://bootswatch.com/' + name + '">' + name + "</a>, " + 'thanks to <a href="https://bitbucket.org/">BitBucket</a>)</div> ' + 
    '<div id="headline-squirt" class="brand"> <a title="Quick reader script! Check http://lbesson.bitbucket.org/squirt/ for more details" ' + "href=\"javascript:(function(){sq=window.sq;if(sq&&sq.closed){window.sq.closed&&window.document.dispatchEvent(new Event('squirt.again'));}else{sq=window.sq||{};sq.version='0.4';sq.host='http://lbesson.bitbucket.org/squirt';sq.j=document.createElement('script');sq.j.src=sq.host+'/squirt.js?src=strapdown.js';document.body.appendChild(sq.j);}})();\" " + ">SquirtFR?</a>" + " <a title=\"Import MathJax?\" href=\"javascript:(function(){ var scriptElMathJax = document.createElement('script'); scriptElMathJax.type = 'text/javascript'; scriptElMathJax.src = 'https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML&amp;locale=fr'; document.head.appendChild(scriptElMathJax); })();\" >MathJax?</a>" + 
    " <a title=\"Fetch a beacon image?\" href=\"javascript:(function(){ var linkEl = document.createElement('img'); linkEl.alt = 'GA|Analytics'; linkEl.style = 'visibility: hidden; display: none;'; linkEl.src = 'http://perso.crans.org/besson/beacon/14/navbar/strapdown.js?pixel'; document.body.appendChild(linkEl); })();\">Beacon?</a>" + "</div> </div> </div>";
    document.body.insertBefore(newNode, document.body.firstChild);
    var h = a.innerHTML;
    /** @type {(HTMLElement|null)} */
    var e = document.getElementById("headline");
    if (e) {
      e.innerHTML = h;
    }
  }
  marked.setOptions({
    gfm : true,
    tables : true,
    smartypants : true,
    pedantic: (fmt['pedantic'] || false)
  });
  var html = marked(markdown);
  document.getElementById("content").innerHTML = html;
  /** @type {NodeList} */
  var expected = document.getElementsByTagName("code");
  /** @type {number} */
  i = 0;
  /** @type {number} */
  var l = expected.length;
  for (;i < l;i++) {
    var obj = expected[i];
    var cls = obj.className;
    /** @type {string} */
    obj.className = "prettyprint lang-" + cls;
  }
  prettyPrint();
  /** @type {NodeList} */
  var parts = document.getElementsByTagName("table");
  /** @type {number} */
  i = 0;
  /** @type {number} */
  l = parts.length;
  for (;i < l;i++) {
    var part = parts[i];
    /** @type {string} */
    part.className = "table table-striped table-bordered";
  }
  /** @type {string} */
  document.body.style.display = "";
  /** @type {Element} */
  var script = document.createElement("script");
  /** @type {string} */
  script.type = "text/x-mathjax-config";
  /** @type {string} */
  script.innerHTML = "MathJax.Hub.Config({ tex2jax: { inlineMath: [['$','$']], displayMath: [ ['$$','$$']], processEscapes: true } });";
  document.body.appendChild(script);
  if (fmt["mathjax"]) {
    /** @type {Element} */
    script = document.createElement("script");
    /** @type {string} */
    script.type = "text/javascript";
    /** @type {string} */
    script.src = "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML&amp;locale=fr";
    document.head.appendChild(script);
  }
  if (fmt["beacon"]) {
    /** @type {Element} */
    node = document.createElement("img");
    /** @type {string} */
    node.alt = "GA|Analytics";
    /** @type {string} */
    node.style = "visibility: hidden; display: none;";
    /** @type {string} */
    node.src = "http://perso.crans.org/besson/beacon/14/query/strapdown.js?pixel";
    document.body.appendChild(node);
  }
})(window, document);
