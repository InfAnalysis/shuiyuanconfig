// ==UserScript==
// @name         水源终结者
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  生成卡片，加强隐私保护
// @author       You
// @match        https://shuiyuan.sjtu.edu.cn/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

//邮箱信息去除
const EMAIL = true;
//卡片分享生成
const CARD = true;
//显示楼层数
const SHOW_POST_NUMBER = true;

// 检测移动设备
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

(function () {
  "use strict";
  if (!EMAIL) return;
  //remove email info
  const observer1 = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        const emailElement = document.querySelector(".email");
        if (emailElement) {
          emailElement.remove();
          console.log("Email element removed");
        }
      }
    }
  });

  observer1.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

(function () {
  "use strict";
  if (!CARD) return;
  const IS_MOBILE_DEVICE =
    document.documentElement.classList.contains("mobile-device");
  const isNoTouchDevice = () =>
    document.documentElement.classList.contains("discourse-no-touch");
  let currentThemeInfo = null;
  const getCurrentThemeInfo = () => {
    if (currentThemeInfo) {
      return currentThemeInfo;
    }
    currentThemeInfo = {};
    currentThemeInfo.themeId = parseInt(
      document.querySelector('meta[name="discourse_theme_id"]')?.content,
      10
    );
    if (Number.isNaN(currentThemeInfo.themeId)) {
      currentThemeInfo.themeId = null;
      // eslint-disable-next-line no-console
      console.error("Unable to get themeId");
    }
    const dataDiscourseSetup = document.getElementById("data-discourse-setup");
    if (dataDiscourseSetup) {
      currentThemeInfo.colorSchemeId = parseInt(
        dataDiscourseSetup.getAttribute("data-user-color-scheme-id"),
        10
      );
      if (Number.isNaN(currentThemeInfo.colorSchemeId)) {
        currentThemeInfo.colorSchemeId = null;
        // eslint-disable-next-line no-console
        console.error("Unable to get colorSchemeId");
      }
      currentThemeInfo.darkSchemeId = parseInt(
        dataDiscourseSetup.getAttribute("data-user-dark-scheme-id"),
        10
      );
      if (Number.isNaN(currentThemeInfo.darkSchemeId)) {
        currentThemeInfo.darkSchemeId = null;
        // eslint-disable-next-line no-console
        console.error("Unable to get darkSchemeId");
      }
      currentThemeInfo.colorSchemeIsDark =
        dataDiscourseSetup
          .getAttribute("data-color-scheme-is-dark")
          ?.toLowerCase() === "true";
    } else {
      // eslint-disable-next-line no-console
      console.error("Missing #data-discourse-setup");
    }
    return currentThemeInfo;
  };
  const addShadowDOMStyle = (shadowRoot, css) => {
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    shadowRoot.appendChild(style);
    return style;
  };

  function createDialog(
    titleText,
    fullnameText,
    usernameText,
    avatarSrc,
    contentText,
    time
  ) {
    const IS_MOBILE_DEVICE =
      document.documentElement.classList.contains("mobile-device");

    // 创建外部 div
    const dialog = document.createElement("div");
    dialog.id = "dialog";
    dialog.tabIndex = -1;
    dialog.classList.add("dialog-box");

    // 移动端适配样式
    if (IS_MOBILE_DEVICE) {
      // 移动端布局
      dialog.style.width = "95%"; // 改为百分比宽度
      dialog.style.maxWidth = "100%"; // 防止超出屏幕
      dialog.style.minHeight = "auto"; // 取消固定高度
      // dialog.style.padding = '15px'; // 缩小内边距
      dialog.style.borderRadius = "8px"; // 缩小圆角
    } else {
      // 桌面端保持原有样式
      dialog.style.width = "400px";
      dialog.style.minHeight = "200px";
      // dialog.style.padding = '20px';
      dialog.style.borderRadius = "10px";
    }

    // 公共样式
    Object.assign(dialog.style, {
      pointerEvents: "auto",
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "white",
      color: "black",
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
      zIndex: "1200",
      margin: "0",
      textAlign: "left",
      boxSizing: "border-box",
      // overflow:"hidden"
    });

    const shareCardParent = document.createElement("div");
    Object.assign(shareCardParent.style, {
      maxHeight: IS_MOBILE_DEVICE ? "50vh" : "60vh", // 降低高度占比
      overflow: "hidden",
    });

    // 创建内部 div
    const innerDiv = document.createElement("div");
    innerDiv.id = "share-card";
    Object.assign(innerDiv.style, {
      pointerEvents: "none",
      backgroundColor: "white",
      margin: "10px 10px 0 10px",
      padding: "10px",
    });

    // 标题适配
    const title = document.createElement(IS_MOBILE_DEVICE ? "h4" : "h3"); // 移动端使用更小标题
    title.id = "title_sk";
    title.textContent = titleText;
    if (IS_MOBILE_DEVICE) {
      title.style.fontSize = "1.1rem"; // 缩小字体
      title.style.marginBottom = "8px"; // 减小间距
    }

    // 头像适配
    const avatar = document.createElement("img");
    avatar.id = "avatar_sk";
    avatar.src = avatarSrc;
    avatar.alt = "Avatar";
    // 确保 html-to-image 可以正确处理图片
    avatar.crossOrigin = "anonymous";
    // 禁用懒加载以确保图片立即加载
    avatar.loading = "eager";

    Object.assign(avatar.style, {
      width: IS_MOBILE_DEVICE ? "25px" : "30px", // 缩小头像
      height: IS_MOBILE_DEVICE ? "25px" : "30px",
      borderRadius: "50%",
      marginRight: "10px",
      verticalAlign: "middle", // 改善对齐
    });

    // 用户信息容器
    const userInfoContainer = document.createElement("div");
    Object.assign(userInfoContainer.style, {
      display: "flex",
      alignItems: "center",
      marginBottom: IS_MOBILE_DEVICE ? "8px" : "12px", // 调整间距
    });

    // 用户名字体适配
    const fullname = document.createElement("span");
    fullname.id = "fullname_sk";
    fullname.textContent = fullnameText;
    fullname.style.fontSize = IS_MOBILE_DEVICE ? "0.95rem" : "1rem";

    const username = document.createElement("span");
    username.id = "username_sk";
    username.textContent = usernameText;
    Object.assign(username.style, {
      fontSize: IS_MOBILE_DEVICE ? "0.85rem" : "0.9rem", // 缩小字体
      color: "grey",
      marginLeft: "6px",
    });

    // 内容区域适配
    const content = document.createElement("p");
    content.id = "content_sk";
    content.appendChild(contentText);
    Object.assign(content.style, {
      textAlign: "left",
      // maxHeight: IS_MOBILE_DEVICE ? '50vh' : '60vh', // 降低高度占比
      overflow: "auto", // 改为自动滚动
      fontSize: IS_MOBILE_DEVICE ? "0.9rem" : "1rem", // 内容字体适配
      lineHeight: "1.4", // 改善可读性,
      overflow: "hidden",
      marginBottom: 0,
    });
    const time_p = document.createElement("p");
    time_p.innerText = time;
    Object.assign(time_p.style, {
      color: "grey",
      textAlign: "right",
      padding: 0,
      margin: 0,
    });

    // 组装元素
    userInfoContainer.appendChild(avatar);
    userInfoContainer.appendChild(fullname);
    userInfoContainer.appendChild(username);

    innerDiv.appendChild(title);
    innerDiv.appendChild(userInfoContainer);
    innerDiv.appendChild(content);
    innerDiv.appendChild(time_p);

    // 按钮区域 - 现在移动端和桌面端都创建按钮区域
    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, {
      display: "flex",
      justifyContent: "space-between",
      margin: "10px 20px 20px 20px",
      pointerEvents: "auto", // 确保按钮可点击
    });

    // 复制链接按钮
    const copyLinkButton = document.createElement("button");
    copyLinkButton.textContent = "复制链接";
    copyLinkButton.id = "copy_link_button";
    Object.assign(copyLinkButton.style, {
      padding: IS_MOBILE_DEVICE ? "6px 12px" : "8px 15px",
      backgroundColor: "#4682B4",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "500",
      flex: "1",
      marginRight: "8px",
      fontSize: IS_MOBILE_DEVICE ? "14px" : "16px", // 移动端字体稍小
    });

    // 下载图片的链接
    const saveImageLink = document.createElement("a");
    saveImageLink.id = "save_image_link";
    // 文件名需要修改
    saveImageLink.download = "test.png";
    Object.assign(saveImageLink.style, {
      padding: IS_MOBILE_DEVICE ? "6px 12px" : "8px 15px",
      backgroundColor: "#3CB371",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "500",
      flex: "1",
      marginLeft: "8px",
      fontSize: IS_MOBILE_DEVICE ? "14px" : "16px", // 移动端字体稍小,
      textAlign: "center",
    });
    saveImageLink.textContent = "保存图片";

    buttonContainer.appendChild(copyLinkButton);
    buttonContainer.appendChild(saveImageLink);

    shareCardParent.appendChild(innerDiv);
    dialog.appendChild(shareCardParent);
    dialog.appendChild(buttonContainer);

    // 移动端增加触摸控制
    if (IS_MOBILE_DEVICE) {
      let startY = 0;
      dialog.addEventListener(
        "touchstart",
        (e) => {
          startY = e.touches[0].clientY;
        },
        { passive: true }
      );

      dialog.addEventListener(
        "touchmove",
        (e) => {
          const deltaY = e.touches[0].clientY - startY;
          if (deltaY > 10) {
            dialog.scrollTop -= deltaY;
          }
        },
        { passive: true }
      );
    }

    return dialog;
  }

  // 复制链接功能
  function copyLink(url) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showFeedback("链接已复制！", "#4682B4");
      })
      .catch((err) => {
        console.error("无法复制链接: ", err);
        // 降级方法
        const tempInput = document.createElement("input");
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        showFeedback("链接已复制！", "blue");
      });
  }

  function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(",")[1]);
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  // 等待所有图片加载完成
  function waitForImages(element, timeout = 3000) {
    return new Promise((resolve) => {
      const images = element.querySelectorAll("img");
      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;
      const timeoutId = setTimeout(() => {
        console.warn("Image loading timeout, proceeding with screenshot");
        resolve();
      }, timeout);

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          checkComplete();
        } else {
          img.onload = checkComplete;
          img.onerror = checkComplete;
        }
      });
    });
  }

  // Firefox 兼容性修复：清理元素的 CSS 属性，避免 html-to-image 报错
  function sanitizeElementStyles(element) {
    const allElements = element.querySelectorAll("*");
    const elementsToProcess = [element, ...allElements];

    elementsToProcess.forEach((el) => {
      // 移除可能导致问题的 CSS 变量引用
      const style = el.style;
      if (style) {
        // 检查并修复可能为 undefined 的样式属性
        for (let i = 0; i < style.length; i++) {
          const prop = style[i];
          const value = style.getPropertyValue(prop);
          // 如果值为空或包含未解析的 CSS 变量，设置为默认值
          if (!value || value === "undefined") {
            style.removeProperty(prop);
          }
        }
      }

      // 移除可能导致问题的属性
      if (el.hasAttribute("data-theme-extension")) {
        el.removeAttribute("data-theme-extension");
      }
    });
  }

  function copyCard() {
    // 等待DOM渲染完成后再截图
    requestAnimationFrame(() => {
      setTimeout(async () => {
        const shareCard = document.getElementById("share-card");
        if (!shareCard) {
          console.error("share-card element not found");
          showFeedback("找不到分享卡片元素！", "red");
          return;
        }
        console.log("Starting screenshot of share-card:", shareCard);

        // 等待所有图片加载完成
        await waitForImages(shareCard);

        // Firefox 兼容性：清理样式
        sanitizeElementStyles(shareCard);

        // 检测是否为 Firefox
        const isFirefox =
          navigator.userAgent.toLowerCase().includes("firefox") ||
          typeof InstallTrigger !== "undefined";

        // Firefox 专用配置
        const options = {
          style: {
            position: "static",
            transform: "translate(-10px,-10px)",
          },
          cacheBust: true,
          skipAutoScale: true,
          useCORS: true,
          quality: 1.0,
          // Firefox 兼容性：过滤可能导致问题的元素
          filter: (node) => {
            // 跳过 script 和 style 标签
            if (node.tagName === "SCRIPT" || node.tagName === "NOSCRIPT") {
              return false;
            }
            // 跳过隐藏元素
            if (node.style && node.style.display === "none") {
              return false;
            }
            return true;
          },
        };

        // Firefox 需要额外配置
        if (isFirefox) {
          options.skipFonts = true; // Firefox 字体处理可能有问题
          options.preferredFontFormat = "woff2";
        }

        htmlToImage
          .toPng(shareCard, options)
          .then(function (dataUrl) {
            console.log(
              "Screenshot successful, dataUrl length:",
              dataUrl.length
            );
            const saveImageLink = document.getElementById("save_image_link");
            if (saveImageLink) {
              saveImageLink.href = dataUrl;
            }
            if (!isMobile) {
              var imgBlob = dataURItoBlob(dataUrl);
              var item = new ClipboardItem({ "image/png": imgBlob });
              navigator.clipboard.write([item]);
              showFeedback("卡片已复制！", "rgb(60, 179, 113)");
            }
          })
          .catch(function (error) {
            console.error("htmlToImage.toPng failed:", error);
            console.error("Error stack:", error.stack);

            // Firefox 降级方案：尝试使用更保守的设置
            if (isFirefox) {
              console.log("Trying Firefox fallback method...");
              htmlToImage
                .toPng(shareCard, {
                  style: {
                    position: "static",
                    transform: "translate(-10px,-10px)",
                  },
                  cacheBust: true,
                  skipFonts: true,
                  includeQueryParams: true,
                  filter: (node) => {
                    // 更严格的过滤
                    if (
                      node.tagName === "SCRIPT" ||
                      node.tagName === "NOSCRIPT" ||
                      node.tagName === "IFRAME" ||
                      node.tagName === "VIDEO" ||
                      node.tagName === "CANVAS"
                    ) {
                      return false;
                    }
                    return true;
                  },
                })
                .then(function (dataUrl) {
                  console.log(
                    "Firefox fallback successful, dataUrl length:",
                    dataUrl.length
                  );
                  const saveImageLink =
                    document.getElementById("save_image_link");
                  if (saveImageLink) {
                    saveImageLink.href = dataUrl;
                  }
                  if (!isMobile) {
                    var imgBlob = dataURItoBlob(dataUrl);
                    var item = new ClipboardItem({ "image/png": imgBlob });
                    navigator.clipboard.write([item]);
                    showFeedback("卡片已复制！", "rgb(60, 179, 113)");
                  }
                })
                .catch(function (fallbackError) {
                  console.error("Firefox fallback also failed:", fallbackError);
                  showFeedback("复制失败！Firefox 兼容性问题", "red");
                });
            } else {
              showFeedback("复制失败！请查看控制台", "red");
            }
          });
      }, 100); // 等待100ms让DOM完全渲染
    });
  }

  const FEEDBACK_DURATION = 3000;
  function showFeedback(message, color) {
    // 移除已存在的反馈提示
    const existingFeedback = document.getElementById(
      "shuiyuan-killer-feedback"
    );
    if (existingFeedback) {
      document.body.removeChild(existingFeedback);
    }

    // 创建新的反馈提示元素
    const feedback = document.createElement("div");
    feedback.id = "shuiyuan-killer-feedback";
    feedback.textContent = message;

    // 设置样式
    Object.assign(feedback.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: color || "#333",
      color: "white",
      padding: "10px 20px",
      borderRadius: "4px",
      zIndex: "10000",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      fontWeight: "500",
      fontSize: "14px",
      textAlign: "center",
      opacity: "0",
      transition: "opacity 0.3s ease",
    });

    // 添加到文档
    document.body.appendChild(feedback);

    // 动画显示
    setTimeout(() => {
      feedback.style.opacity = "1";
    }, 10);

    // 设置自动消失
    setTimeout(() => {
      feedback.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(feedback)) {
          document.body.removeChild(feedback);
        }
      }, 300);
    }, FEEDBACK_DURATION);
  }

  // 对内容的背景色、边框链接等处理
  function processContent(element) {
    // 重置引用形式
    function processBackgroundColor(element, light = 255) {
      const darkenFactor = 0.9; // 每层加深倍率
      if (
        Array.from(element.children).some(
          (child) =>
            child.tagName.toLowerCase() === "blockquote" &&
            child.hasAttribute("id")
        )
      ) {
        light = Math.floor(light * darkenFactor);
        element.style.borderLeft = "4px solid rgb(84, 84, 84)";
        Array.from(element.children).forEach((element) => {
          element.style.borderLeft = "0px solid rgb(84, 84, 84)";
        });
        if (
          element.firstElementChild &&
          element.firstElementChild.children.length > 1
        ) {
          element.firstElementChild.children[1].style.borderRadius = "50%";
        }
      } else if (
        element.tagName.toLowerCase() === "blockquote" &&
        !element.hasAttribute("id")
      ) {
        light = Math.floor(light * darkenFactor);
        element.style.borderLeft = "4px solid rgb(84, 84, 84)";
      }
      element.style.backgroundColor = `rgb(${light}, ${light}, ${light})`;
      Array.from(element.children).forEach((child) =>
        processBackgroundColor(child, light)
      );
    }
    // 重置文本格式
    function setTextColor(element) {
      if (element.tagName === "A") {
        element.style.color = "#0f82af";
      } else {
        element.style.color = "black";
      }
      element.querySelectorAll("[data-clicks]").forEach((element) => {
        element.removeAttribute("data-clicks");
      });
      Array.from(element.children).forEach((child) => setTextColor(child));
    }
    // 重置onebox边框
    function setAsideBorder(element) {
      element.querySelectorAll("aside.onebox").forEach((element) => {
        element.style.border = "4px solid darkgray"; // 将边框颜色设置为深灰色，并设置边框宽度
      });
    }
    Array.from(element.children).forEach((child) =>
      processBackgroundColor(child)
    );
    setTextColor(element);
    setAsideBorder(element);
  }

  // 将相对 URL 转换为绝对 URL
  function toAbsoluteUrl(url) {
    if (!url) return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    // 处理相对路径
    if (url.startsWith("/")) {
      return window.location.origin + url;
    }
    return window.location.origin + "/" + url;
  }

  // 添加将图片URL转换为base64的函数
  async function imageUrlToBase64(url) {
    if (!url) return null;
    const absoluteUrl = toAbsoluteUrl(url);
    try {
      const response = await fetch(absoluteUrl, {
        mode: "cors",
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(
        "Error converting image to base64:",
        error,
        "URL:",
        absoluteUrl
      );
      return null;
    }
  }

  //传入actions
  function addShareButton(actions) {
    const element = actions.closest(".row");
    if (
      element.querySelector("#share-button") ||
      actions.classList.contains("share-button-added") ||
      actions.querySelector(".shuiyuan-killer-share-button")
    ) {
      return;
    }

    if (!actions.shadowRoot) {
      actions.attachShadow({ mode: "open" });
    }
    addShadowDOMStyle(
      actions.shadowRoot,
      `
                .shuiyuan-killer-share-button {
                    margin-left: var(--control-margin);
                    flex: 0 1 auto;
                    font-size: var(--font-up-1);
                    padding: 8px 10px;
                    vertical-align: top;
                    background: transparent;
                    border: none;
                    color: var(--primary-low-mid-or-secondary-high);
                    cursor: pointer;
                    -webkit-appearance: button;
                    overflow: visible;
                    line-height: var(--line-height-small);
                    transition: color 0.25s, background 0.25s;
                }
                .shuiyuan-killer-share-button:active,
                .shuiyuan-killer-share-button:focus {
                    outline: none;
                    background: var(--primary-low);
                    color: var(--primary);
                }
                .shuiyuan-killer-share-button.pending {
                    cursor: wait;
                }
                .shuiyuan-killer-share-button > svg {
                    opacity: 1;
                    color: var(--primary-low-mid);
                    height: 1em;
                    width: 1em;
                    line-height: 1;
                    display: inline-flex;
                    position: relative;
                    vertical-align: -0.125em;
                    fill: currentColor;
                    flex-shrink: 0;
                    overflow: visible;
                }
                .shuiyuan-killer-share-button:focus > svg {
                    color: var(--primary);
                }
            `
    );
    if (!IS_MOBILE_DEVICE) {
      addShadowDOMStyle(
        actions.shadowRoot,
        `
                    .shuiyuan-killer-share-button:hover {
                        outline: none;
                        background: var(--primary-low);
                        color: var(--primary);
                    }
                    .shuiyuan-killer-share-button:hover > svg {
                        color: var(--primary);
                    }
                `
      );
    }
    switch (getCurrentThemeInfo().themeId) {
      case 31: // graceful
        addShadowDOMStyle(
          actions.shadowRoot,
          `
                        .shuiyuan-killer-share-button.btn-flat {
                            border-radius: 4px;
                        }
                    `
        );
        break;
      case 43: // Isabelle
        addShadowDOMStyle(
          actions.shadowRoot,
          `
                        .shuiyuan-killer-share-button.btn-flat {
                            color: #68c6b9;
                            border-radius: 20px;
                            transition: top 0.25s, background-color 0.3s;
                        }
                        .shuiyuan-killer-share-button.btn-flat > svg {
                            color: #68c6b9;
                        }
                    `
        );
        if (isNoTouchDevice()) {
          addShadowDOMStyle(
            actions.shadowRoot,
            `
                            .shuiyuan-killer-share-button.btn-flat:hover {
                                background: #015562;
                                box-shadow: 0 4px 0 0 #00333d;
                                position: relative;
                                top: -3px;
                                color: #faf7e9;
                            }
                            .shuiyuan-killer-share-button.btn-flat:hover > svg {
                                color: #faf7e9;
                            }
                        `
          );
        }
        break;
    }
    let button = document.createElement("button");
    button.classList.add(
      "widget-button",
      "btn-flat",
      "shuiyuan-killer-share-button",
      "no-text",
      "btn-icon"
    );
    button.id = "share-button";
    button.title = "将帖子分享为图片";
    // button.className = "share-button"

    const SHARE_ICON =
      '<svg class="d-icon svg-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"></path></svg>';

    button.innerHTML = SHARE_ICON;

    actions.shadowRoot.insertBefore(
      button,
      actions.shadowRoot.firstElementChild
    );
    actions.shadowRoot.appendChild(document.createElement("slot"));

    // 对话框
    button.addEventListener("click", async function (event) {
      // 添加event参数以便后续使用
      const titleText =
        document.title.match(/^(.*?) - .* - .*$/)?.[1] ||
        document.body.querySelector(".topic-link")?.querySelector("span")
          .innerText ||
        document.body.querySelector(".fancy-title")?.innerText ||
        "";
      // 修复：新版Discourse中.post-date是div，需要查找内部的a标签
      const postLink =
        element.querySelector("a.post-date") ||
        element.querySelector(".post-date a") ||
        element.querySelector(".widget-link") ||
        element.querySelector('a[href*="/t/topic/"]');
      const postHref =
        postLink?.getAttribute("href") ||
        postLink?.href ||
        window.location.pathname;
      const url = "https://shuiyuan.sjtu.edu.cn" + postHref.split("?")[0];
      const content = element.querySelector(".cooked").cloneNode(true);
      // 修复：兼容新版 Discourse avatar 结构（2025.12.0+）
      // 新版结构：.post-avatar > a.main-avatar > img.avatar
      const avatarImg =
        element.querySelector(".post-avatar img.avatar") ||
        element.querySelector(".topic-avatar img.avatar") ||
        element.querySelector("a.main-avatar img") ||
        element.querySelector(".trigger-user-card.main-avatar img") ||
        element.querySelector(".trigger-user-card.main-avatar")?.firstChild;
      const avatarSrc = avatarImg?.getAttribute("src") || avatarImg?.src || "";
      // 转换为绝对 URL 并获取 base64
      const avatarAbsoluteUrl = toAbsoluteUrl(avatarSrc);
      const avatarBase64 = await imageUrlToBase64(avatarAbsoluteUrl);
      // 如果 base64 转换失败，使用绝对 URL 作为后备
      const avatar = avatarBase64 || avatarAbsoluteUrl;

      // 修复：兼容新版用户名结构
      const namesContainer =
        element.querySelector(".topic-meta-data .names") ||
        element.querySelector(".topic-meta-data");
      const fullname =
        namesContainer?.querySelector(".first")?.firstChild?.textContent ||
        namesContainer?.querySelector('[class*="full-name"]')?.textContent ||
        "";
      const username =
        namesContainer?.querySelector(".second")?.firstChild?.textContent ||
        namesContainer?.querySelector('[class*="username"]')?.textContent ||
        "";
      // 修复：添加容错处理
      const relativeDateEl =
        element.querySelector(".relative-date") ||
        element.querySelector('[class*="relative-date"]') ||
        element.querySelector("time");
      const time =
        relativeDateEl?.title || relativeDateEl?.getAttribute("datetime") || "";
      const existingDialog = document.getElementById("dialog");
      if (existingDialog) {
        document.body.removeChild(existingDialog);
      }

      const dialog = createDialog(
        titleText,
        fullname,
        username,
        avatar,
        content,
        time
      );
      dialog.dataset.url = url;
      processContent(content);

      // 添加对话框关闭按钮（移动端需要）
      if (IS_MOBILE_DEVICE) {
        const closeBtn = document.createElement("div");
        // closeBtn.innerHTML = '×';
        Object.assign(closeBtn.style, {
          position: "fixed",
          // top: '10px',
          // right: '15px',
          // fontSize: '24px',
          // cursor: 'pointer',
          backgroundColor: "var(--primary)",
          // pointerEvents: 'auto' // 确保可点击
          width: "100%",
          height: "100%",
          zIndex: "1100",
          top: "0px",
          opacity: ".8",
        });
        closeBtn.onclick = () => {
          dialog.remove();
          closeBtn.remove();
        };
        document.body.appendChild(closeBtn);
      }

      document.body.appendChild(dialog);

      // 在这里添加页面可见性事件监听代码
      if (IS_MOBILE_DEVICE) {
        // 添加页面可见性事件监听，处理用户从保存图片页面返回的情况
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            // 当页面重新变为可见状态时，检查并移除对话框
            const existingDialog = document.getElementById("dialog");
            if (existingDialog) {
              document.body.removeChild(existingDialog);
            }
            // 移除监听器，避免多次执行
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange
            );
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // 5秒后自动移除监听器，避免长时间残留
        setTimeout(() => {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
        }, 5000);
      }

      // 设置点击外部关闭逻辑
      function handleOutsideClick(e) {
        if (dialog && !dialog.contains(e.target)) {
          if (document.body.contains(dialog)) {
            document.body.removeChild(dialog);
          }
          document.removeEventListener("click", handleOutsideClick);
        }
      }

      // 阻止对话框内部点击事件冒泡
      dialog.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      // 处理按钮点击事件，现在移动端和桌面端使用相同逻辑
      const copyLinkBtn = dialog.querySelector("#copy_link_button");

      if (copyLinkBtn) {
        copyLinkBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          copyLink(url);
        });
      }
      copyCard(dialog);

      setTimeout(() => {
        document.addEventListener("click", handleOutsideClick);
      }, 100);

      dialog.focus();

      // 阻止当前点击事件冒泡到document
      event.stopPropagation();
    });
    actions.classList.add("share-button-added");
  }

  // 页面加载完成后，检查现有的 .actions 元素
  document.querySelectorAll(".actions").forEach((actions) => {
    addShareButton(actions);
  });

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.matches(".actions") //&& !node.matches('.share-button-added')
          ) {
            // console.log("node is", node.cloneNode(true))
            addShareButton(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll(".actions").forEach((elem) => {
              addShareButton(elem);
            });
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

(function () {
  "use strict";
  // 添加显示楼层数功能 传入row
  function addPostNumberDisplay(element) {
    if (element.querySelector(".post-number-display")) {
      return; // 已经添加过楼层显示，不重复添加
    }

    const isReply =
      element.parentNode.role == "region" &&
      element.parentNode.classList.contains("reply");

    // 获取帖子链接 - 修复：新版Discourse中.post-date是div，需要查找内部的a标签
    const postLink =
      element.querySelector(".post-info.arrow") ||
      element.querySelector("a.post-date") ||
      element.querySelector(".post-date a") ||
      element.querySelector(".widget-link.post-date") ||
      element.querySelector('a[href*="/t/topic/"]');
    if (!postLink) return;

    const href = postLink.getAttribute("href");
    // 从链接中提取楼层数
    const postNumberMatch = href.match(/\/(?:\d+)\/(\d+)(?:\?|$)/);
    const postNumber = postNumberMatch ? postNumberMatch[1] : 1;

    // 创建楼层显示元素
    const postNumberDisplay = document.createElement("div");
    postNumberDisplay.classList.add("post-number-display");
    postNumberDisplay.textContent = `#${postNumber}`;

    // 设置样式
    Object.assign(postNumberDisplay.style, {
      position: "absolute",
      // bottom: '8px',
      // left: '12px',
      fontSize: "13px",
      color: "var(--primary-medium)",
      fontWeight: "bold",
      opacity: "0.8",
      // padding: '2px 6px',
      // borderRadius: '4px',
      backgroundColor: "var(--primary-very-low)",
      zIndex: "1",
      top: isReply ? (isMobile ? "0px" : "15px") : isMobile ? "25px" : "37px",
      right: isMobile ? "5px" : "15px",
    });

    // 确保帖子有相对定位，以便正确放置楼层显示
    const postBody = element.querySelector(".topic-body");
    if (postBody) {
      if (getComputedStyle(postBody).position === "static") {
        postBody.style.position = "relative";
      }
      postBody.appendChild(postNumberDisplay);
    }
  }

  // 页面加载完成后，检查现有的 .row 元素
  document.querySelectorAll(".row").forEach((post) => {
    post.classList.add("post-number-display");
    if (SHOW_POST_NUMBER) {
      addPostNumberDisplay(post);
    }
  });

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.matches(".row") &&
            !node.matches(".post-number-display")
          ) {
            // console.log("node is", node.cloneNode(true))
            node.classList.add("post-number-display");
            if (SHOW_POST_NUMBER) {
              addPostNumberDisplay(node);
            }
          } else if (node.querySelectorAll) {
            node.querySelectorAll(".row").forEach((elem) => {
              if (!elem.classList.contains("post-number-display")) {
                elem.classList.add("post-number-display");
                if (SHOW_POST_NUMBER) {
                  addPostNumberDisplay(elem);
                }
              }
            });
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

(function () {
  window.Discourse.__container__.lookup(
    "service:site-settings"
  ).allow_username_in_share_links = false;
})();
