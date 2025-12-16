import React, { memo, useState, useEffect, useRef, Suspense } from "react";
import PropTypes from "prop-types";
import ReactECharts from "echarts-for-react";
import { Download, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

// ChartContainer component with Intersection Observer for lazy loading
const ChartContainer = memo(({ dateGroup, index, onToggleDropdown, activeDropdown, isEnglish, getChartOption }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef();
  const chartRef = useRef();

    // Helper function to wrap text with line breaks
  const wrapText = (text, maxCharsPerLine = 12, dataLength = 5, percentage = null) => {
    if (!text) return '';
    
    console.log(percentage, "percentage");
    
    // Dynamic character limit based on number of data items
    // With fewer items, we can afford longer names on one line
    let effectiveLimit = maxCharsPerLine;
     if (dataLength === 2) {
      if (percentage !== null && percentage < 30) {
        // Small slice in 2-partner chart - allow more characters
        effectiveLimit = Math.max(maxCharsPerLine * 2.5, 25);
      }
     } else if (dataLength === 3) {
      if (percentage !== null && percentage < 20) {
        // Small slice in 3-partner chart - use moderate spacing
        effectiveLimit = Math.max(maxCharsPerLine * 1.5, 20);
      } 
    } else if (dataLength <= 2) {
      effectiveLimit = Math.max(maxCharsPerLine * 2, 20); // Much more generous for 3 or fewer items
    } else if (dataLength <= 4) {
      effectiveLimit = Math.max(maxCharsPerLine * 1.5, 15); // More generous for 5 or fewer items
    }
    
    // If text fits within the dynamic limit, return as is
    if (text.length <= effectiveLimit) {
      return text;
    }
    
    // If text contains spaces, try to split at word boundaries
    if (text.includes(' ')) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        if (testLine.length <= effectiveLimit) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Single word is too long, break it only if extremely long (>25 chars)
            if (word.length > 20) {
              lines.push(word.substring(0, effectiveLimit));
              currentLine = word.substring(effectiveLimit);
            } else {
              currentLine = word;
            }
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines.join('\n');
    }
    
    // For single words without spaces, keep on one line unless extremely long
    if (text.length <= 20) {
      return text;
    }
    
    // Only break extremely long single words
    return text.match(new RegExp(`.{1,${effectiveLimit}}`, 'g')).join('\n');
  };

  // Generic download handler for all formats
  const handleDownload = (format) => {
    if (!chartRef.current) return;

    const echartInstance = chartRef.current.getEchartsInstance();
    const fileName = `partners_chart_${dateGroup.date.replace(/\//g, "_")}`;

    try {
      switch (format) {
        case "png": {
          const pngUrl = echartInstance.getDataURL({
            type: "png",
            pixelRatio: 2,
            backgroundColor: "#fff",
          });
          const pngLink = document.createElement("a");
          pngLink.download = `${fileName}.png`;
          pngLink.href = pngUrl;
          pngLink.click();
          break;
        }

        case "jpeg": {
          const jpegUrl = echartInstance.getDataURL({
            type: "jpeg",
            pixelRatio: 2,
            backgroundColor: "#fff",
          });
          const jpegLink = document.createElement("a");
          jpegLink.download = `${fileName}.jpeg`;
          jpegLink.href = jpegUrl;
          jpegLink.click();
          break;
        }

        case "svg": {
          try {
            const canvasDataURL = echartInstance.getDataURL({
              type: "png",
              pixelRatio: 2,
              backgroundColor: "#fff",
            });

            const img = new Image();
            img.onload = function () {
              const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${img.width}" height="${img.height}">
                <image width="${img.width}" height="${img.height}" xlink:href="${canvasDataURL}"/>
              </svg>`;

              const svgBlob = new Blob([svgContent], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(svgBlob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${fileName}.svg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              toast.success(
                isEnglish
                  ? "Chart SVG downloaded successfully!"
                  : "დიაგრამა SVG ფორმატში წარმატებით ჩამოიტვირთა!"
              );
            };

            img.onerror = function () {
              console.error("SVG creation error: Failed to load image");
              // Fallback to PNG export
              const pngUrl = echartInstance.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#fff",
              });
              const pngLink = document.createElement("a");
              pngLink.download = `${fileName}_fallback.png`;
              pngLink.href = pngUrl;
              pngLink.click();

              toast.warning(
                isEnglish
                  ? "SVG export failed, downloaded PNG instead"
                  : "SVG ექსპორტი ვერ მოხერხდა, ჩამოიტვირთა PNG"
              );
            };

            img.src = canvasDataURL;
            // Early return since we're handling async operation
            return;
          } catch (error) {
            console.error("SVG setup error:", error);
            // Fallback to PNG export
            const pngUrl = echartInstance.getDataURL({
              type: "png",
              pixelRatio: 2,
              backgroundColor: "#fff",
            });
            const pngLink = document.createElement("a");
            pngLink.download = `${fileName}_fallback.png`;
            pngLink.href = pngUrl;
            pngLink.click();

            toast.warning(
              isEnglish
                ? "SVG export failed, downloaded PNG instead"
                : "SVG ექსპორტი ვერ მოხერხდა, ჩამოიტვირთა PNG"
            );
          }
          break;
        }

        case "print": {
          // Direct print without PDF save
          const printWindow = window.open("", "_blank");
          const chartDataUrl = echartInstance.getDataURL({
            type: "png",
            pixelRatio: 2,
            backgroundColor: "#fff",
          });
          printWindow.document.write(`
            <html>
              <head>
                <title>Partners Chart - ${dateGroup.date}</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    text-align: center; 
                    font-family: Arial, sans-serif;
                  }
                  img { 
                    max-width: 100%; 
                    height: auto; 
                    border: 1px solid #ddd;
                    border-radius: 8px;
                  }
                  h1 { 
                    color: #0080BE; 
                    margin-bottom: 20px;
                    font-size: 24px;
                  }
                  .print-info {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                  }
                  @media print {
                    body { margin: 0; padding: 10px; }
                    h1 { page-break-before: avoid; font-size: 20px; }
                    .print-info { font-size: 10px; }
                  }
                </style>
              </head>
              <body>
                <h1>პარტნიორთა წილები - ${dateGroup.date}</h1>
                <img src="${chartDataUrl}" alt="Partners Chart" />
                <div class="print-info">
                  Generated on: ${new Date().toLocaleDateString()}
                </div>
                <script>
                  window.onload = function() {
                    setTimeout(() => {
                      window.print();
                    }, 500);
                  };
                  window.onafterprint = function() {
                    window.close();
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          break;
        }

        default:
          break;
      }

      // Show success toast for PNG and JPEG formats only (SVG handles its own messaging)
      if (format === "png" || format === "jpeg") {
        toast.success(
          isEnglish
            ? `Chart ${format.toUpperCase()} downloaded successfully!`
            : `დიაგრამა ${format.toUpperCase()} ფორმატში წარმატებით ჩამოიტვირთა!`
        );
      }
    } catch (error) {
      console.error("Chart download error:", error);
      toast.error(
        isEnglish
          ? `Error downloading chart as ${format.toUpperCase()}`
          : `შეცდომა დიაგრამის ${format.toUpperCase()} ფორმატში ჩამოტვირთვისას`
      );
    }

    // Close dropdown after download
    onToggleDropdown(null);
  };

  // PDF download handler
  const handlePdfDownload = () => {
    if (!chartRef.current) return;

    const echartInstance = chartRef.current.getEchartsInstance();
    const fileName = `partners_chart_${dateGroup.date.replace(/\//g, "_")}`;

    import("jspdf")
      .then(({ jsPDF }) => {
        // Get chart as canvas
        const chartCanvas = document.createElement("canvas");
        const chartCtx = chartCanvas.getContext("2d");
        const img = new Image();

        img.onload = function () {
          // Set up canvas dimensions with space for title
          const titleHeight = 60;
          const totalWidth = img.width;
          const totalHeight = img.height + titleHeight;

          chartCanvas.width = totalWidth;
          chartCanvas.height = totalHeight;

          // White background
          chartCtx.fillStyle = "white";
          chartCtx.fillRect(0, 0, totalWidth, totalHeight);

          // Draw title with proper Georgian font support
          chartCtx.fillStyle = "#000000";
          chartCtx.textAlign = "center";
          chartCtx.textBaseline = "middle";

          // Use a Georgian-compatible font stack
          const fontSize = Math.min(totalWidth * 0.03, 24);
          chartCtx.font = `bold ${fontSize}px "Noto Sans Georgian", "BPG Nino Mtavruli", "Sylfaen", Arial, sans-serif`;

          // Draw title with word wrapping if needed
          const title = `პარტნიორთა წილები - ${dateGroup.date}`;
          const words = title.split(" ");
          const titleMaxWidth = totalWidth * 0.8;
          let line = "";
          let titleY = titleHeight / 2;
          const lineHeight = fontSize * 1.2;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = chartCtx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > titleMaxWidth && n > 0) {
              chartCtx.fillText(line, totalWidth / 2, titleY);
              line = words[n] + " ";
              titleY += lineHeight;
            } else {
              line = testLine;
            }
          }
          chartCtx.fillText(line, totalWidth / 2, titleY);

          // Draw the chart below the title
          chartCtx.drawImage(img, 0, titleHeight);

          // Convert to image data
          const imgData = chartCanvas.toDataURL("image/png");

          const canvasWidth = chartCanvas.width;
          const canvasHeight = chartCanvas.height;
          const ratio = canvasWidth / canvasHeight;

          const orientation = ratio > 1 ? "landscape" : "portrait";
          const pdf = new jsPDF({
            orientation,
            unit: "mm",
            format: "a4",
          });

          const a4Width = orientation === "landscape" ? 297 : 210;
          const a4Height = orientation === "landscape" ? 210 : 297;
          const margin = 10;

          // Calculate dimensions to fit page
          const pdfMaxWidth = a4Width - margin * 2;
          const pdfMaxHeight = a4Height - margin * 2;

          let imgWidth, imgHeight;
          if (ratio > pdfMaxWidth / pdfMaxHeight) {
            imgWidth = pdfMaxWidth;
            imgHeight = pdfMaxWidth / ratio;
          } else {
            imgHeight = pdfMaxHeight;
            imgWidth = pdfMaxHeight * ratio;
          }

          const pdfX = (a4Width - imgWidth) / 2;
          const pdfY = (a4Height - imgHeight) / 2;

          // Add the complete image (title + chart)
          pdf.addImage(imgData, "PNG", pdfX, pdfY, imgWidth, imgHeight);
          pdf.save(`${fileName}.pdf`);

          toast.success(
            isEnglish
              ? "Chart PDF downloaded successfully!"
              : "დიაგრამა PDF ფორმატში წარმატებით ჩამოიტვირთა!"
          );
        };

        img.src = echartInstance.getDataURL({
          type: "png",
          pixelRatio: 2,
          backgroundColor: "#fff",
        });
      })
      .catch((error) => {
        console.error("PDF export error:", error);
        toast.error(
          isEnglish
            ? "Error creating PDF"
            : "შეცდომა PDF ფაილის შექმნისას"
        );
      });

    // Close dropdown after PDF download
    onToggleDropdown(null);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          // Load chart with a small delay to improve performance
          setTimeout(() => {
            setIsVisible(true);
          }, 100);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-xl shadow-lg overflow-hidden bg-white"
    >
      <div className="bg-[#005c9d] px-4 py-2 flex items-center justify-between">
        <h2 className="text-white text-sm md:text-base font-semibold leading-tight">
          პარტნიორთა წილები, {dateGroup.date}
        </h2>
        <div className="relative">
          <button
            onClick={() => onToggleDropdown(index)}
            className="flex items-center gap-1 text-white hover:text-gray-200 transition-colors cursor-pointer"
          >
            <Download size={18} />
            <ChevronDown size={14} />
          </button>

          {activeDropdown === index && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]">
              <div className="py-2">
                <button
                  onClick={() => handleDownload('print')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 4V1C3 0.447715 3.44772 0 4 0H12C12.5523 0 13 0.447715 13 1V4H14.5C15.3284 4 16 4.67157 16 5.5V11.5C16 12.3284 15.3284 13 14.5 13H13V15C13 15.5523 12.5523 16 12 16H4C3.44772 16 3 15.5523 3 15V13H1.5C0.671573 13 0 12.3284 0 11.5V5.5C0 4.67157 0.671573 4 1.5 4H3Z"
                      fill="#4A5568"
                    />
                    <path d="M4 1V4H12V1H4Z" fill="#E2E8F0" />
                    <path
                      d="M1.5 5C1.22386 5 1 5.22386 1 5.5V11.5C1 11.7761 1.22386 12 1.5 12H3V10H13V12H14.5C14.7761 12 15 11.7761 15 11.5V5.5C15 5.22386 14.7761 5 14.5 5H1.5Z"
                      fill="#A0AEC0"
                    />
                    <path d="M4 10V15H12V10H4Z" fill="#E2E8F0" />
                    <path d="M5 11H11V12H5V11Z" fill="#CBD5E0" />
                    <path d="M5 13H9V14H5V13Z" fill="#CBD5E0" />
                    <circle cx="13" cy="7" r="1" fill="#68D391" />
                  </svg>
                  {isEnglish ? "Print Chart" : "ბეჭდვა"}
                </button>

                <button
                  onClick={() => handleDownload('png')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.07433 0H10.8764L15.9998 5.12345V14.962C15.9998 16.1567 15.0216 17.135 13.8269 17.135H5.07433C3.87963 17.135 2.90137 16.1567 2.90137 14.962V2.17296C2.90137 0.978265 3.87967 0 5.07433 0Z"
                      fill="#0AC963"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.876 0L15.9994 5.12345H11.4292C11.1247 5.12345 10.876 4.87473 10.876 4.57018V0Z"
                      fill="#08A14F"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.476901 7.29639H12.2779C12.5393 7.29639 12.7548 7.51084 12.7548 7.77329V12.1025C12.7548 12.365 12.5393 12.5794 12.2779 12.5794H0.476901C0.214455 12.5794 3.91584e-09 12.365 3.91584e-09 12.1025V7.77329C-3.34628e-05 7.51084 0.214455 7.29639 0.476901 7.29639Z"
                      fill="#08A14F"
                    />
                  </svg>
                  {isEnglish ? "PNG" : "PNG"}
                </button>

                <button
                  onClick={() => handleDownload('jpeg')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="19"
                    viewBox="0 0 16 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.64726 0H2.82682C2.17012 0 1.63477 0.535356 1.63477 1.19563V17.0814C1.63477 17.7417 2.17012 18.2735 2.83039 18.277H14.8045C15.4648 18.277 15.9966 17.7417 16.0001 17.0814L15.9645 5.28218L9.64726 0Z"
                      fill="#4EB3F2"
                    />
                    <path
                      d="M9.64675 0L9.62891 5.15726C9.62891 5.15726 9.64675 5.28218 9.75382 5.28218H15.964L9.64675 0Z"
                      fill="#0077CC"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.485389 8.80444H12.5345C12.8021 8.80444 13.0199 9.02215 13.0199 9.28983V14.6719C13.0199 14.9396 12.8021 15.1573 12.5345 15.1573H0.485389C0.217711 15.1573 0 14.9396 0 14.6719V9.28983C0 9.02215 0.217711 8.80444 0.485389 8.80444Z"
                      fill="#0077CC"
                    />
                    <path
                      d="M3.8225 10.675H4.65051V12.1276C4.65051 12.431 4.62196 12.6666 4.56843 12.8236C4.50775 12.9914 4.39354 13.1341 4.24364 13.2269C4.07947 13.3376 3.87246 13.3911 3.61549 13.3911C3.34425 13.3911 3.13724 13.3554 2.98734 13.2804C2.84458 13.2091 2.72323 13.0984 2.64471 12.9592C2.55906 12.7986 2.50909 12.6202 2.50195 12.4382L3.29071 12.3311C3.28714 12.4203 3.29785 12.5095 3.32283 12.5952C3.34068 12.6487 3.37637 12.6987 3.42277 12.7344C3.46202 12.7594 3.50842 12.7736 3.55839 12.7701C3.64048 12.7772 3.719 12.7344 3.76182 12.6666C3.80465 12.5988 3.82607 12.481 3.82607 12.3204L3.8225 10.675Z"
                      fill="white"
                    />
                    <path
                      d="M5.19727 10.675H6.57135C6.87114 10.675 7.09599 10.7464 7.24233 10.8892C7.39222 11.032 7.46717 11.2354 7.46717 11.4959C7.46717 11.7672 7.38509 11.9777 7.22448 12.1276C7.06387 12.2775 6.81404 12.3561 6.48212 12.3561H6.02885V13.3483H5.20083V10.675H5.19727ZM6.02885 11.8171H6.23229C6.39289 11.8171 6.50353 11.7886 6.56778 11.7351C6.63202 11.6815 6.66771 11.603 6.66414 11.5209C6.66771 11.4424 6.63559 11.3639 6.57848 11.3068C6.52138 11.2497 6.41788 11.2175 6.26441 11.2175H6.02885V11.8171Z"
                      fill="white"
                    />
                    <path
                      d="M9.24034 12.3812V11.8244H10.5181V12.9629C10.2754 13.1307 10.0576 13.2413 9.86849 13.302C9.65078 13.3662 9.42593 13.3983 9.20108 13.3912C8.88344 13.3912 8.62646 13.3377 8.4266 13.2306C8.22673 13.1199 8.06256 12.9522 7.96262 12.7488C7.84841 12.5203 7.79131 12.2669 7.79845 12.0135C7.79845 11.7209 7.85912 11.4675 7.9769 11.2533C8.09825 11.0392 8.28384 10.8643 8.50512 10.7608C8.68714 10.6752 8.92983 10.6323 9.23677 10.6323C9.533 10.6323 9.75428 10.6609 9.90061 10.7108C10.0434 10.7608 10.1683 10.8465 10.2647 10.9607C10.3682 11.0856 10.4431 11.2319 10.4824 11.389L9.68647 11.5317C9.65792 11.4389 9.60081 11.3568 9.51872 11.2997C9.4295 11.2426 9.326 11.2141 9.21893 11.2212C9.05475 11.2141 8.89414 11.2855 8.78707 11.4104C8.68 11.5353 8.62647 11.7352 8.62647 12.0064C8.62647 12.2955 8.68 12.5025 8.79064 12.6274C8.89771 12.7523 9.05118 12.813 9.24748 12.813C9.3367 12.813 9.42593 12.7987 9.51159 12.7737C9.61152 12.7381 9.70788 12.6917 9.80068 12.6381V12.3883L9.24034 12.3812Z"
                      fill="white"
                    />
                  </svg>
                  {isEnglish ? "JPEG" : "JPEG"}
                </button>

                <button
                  onClick={() => handleDownload('svg')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.07433 0H10.8764L15.9998 5.12345V14.962C15.9998 16.1567 15.0216 17.135 13.8269 17.135H5.07433C3.87963 17.135 2.90137 16.1567 2.90137 14.962V2.17296C2.90137 0.978265 3.87967 0 5.07433 0Z"
                      fill="#9F7AEA"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.876 0L15.9994 5.12345H11.4292C11.1247 5.12345 10.876 4.87473 10.876 4.57018V0Z"
                      fill="#805AD5"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.476901 7.29639H12.2779C12.5393 7.29639 12.7548 7.51084 12.7548 7.77329V12.1025C12.7548 12.365 12.5393 12.5794 12.2779 12.5794H0.476901C0.214455 12.5794 3.91584e-09 12.365 3.91584e-09 12.1025V7.77329C-3.34628e-05 7.51084 0.214455 7.29639 0.476901 7.29639Z"
                      fill="#805AD5"
                    />
                    <path
                      d="M2.5 9.5H4.5V10.5H2.5V9.5Z"
                      fill="white"
                    />
                    <path d="M5 9.5H6V10.5H5V9.5Z" fill="white" />
                    <path
                      d="M6.5 9.5H9.5V10.5H6.5V9.5Z"
                      fill="white"
                    />
                    <path
                      d="M10 9.5H11V10.5H10V9.5Z"
                      fill="white"
                    />
                    <path
                      d="M2.5 11H3.5V11.5H2.5V11Z"
                      fill="white"
                    />
                    <path d="M4 11H7V11.5H4V11Z" fill="white" />
                    <path
                      d="M7.5 11H9V11.5H7.5V11Z"
                      fill="white"
                    />
                  </svg>
                  {isEnglish ? "SVG" : "SVG"}
                </button>

                <button
                  onClick={handlePdfDownload}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.07433 0H10.8764L15.9998 5.12345V14.962C15.9998 16.1567 15.0216 17.135 13.8269 17.135H5.07433C3.87963 17.135 2.90137 16.1567 2.90137 14.962V2.17296C2.90137 0.978265 3.87967 0 5.07433 0Z"
                      fill="#DC2626"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.876 0L15.9994 5.12345H11.4292C11.1247 5.12345 10.876 4.87473 10.876 4.57018V0Z"
                      fill="#B91C1C"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.476901 7.29639H12.2779C12.5393 7.29639 12.7548 7.51084 12.7548 7.77329V12.1025C12.7548 12.365 12.5393 12.5794 12.2779 12.5794H0.476901C0.214455 12.5794 3.91584e-09 12.365 3.91584e-09 12.1025V7.77329C-3.34628e-05 7.51084 0.214455 7.29639 0.476901 7.29639Z"
                      fill="#B91C1C"
                    />
                    <path
                      d="M2.5 8.8H4.2C4.53137 8.8 4.8 9.06863 4.8 9.4V10.6C4.8 10.9314 4.53137 11.2 4.2 11.2H3.3V11.8H2.5V8.8ZM3.3 9.4V10.6H4.2V9.4H3.3Z"
                      fill="white"
                    />
                    <path
                      d="M5.5 8.8H6.7C7.2 8.8 7.6 9.2 7.6 9.7V10.9C7.6 11.4 7.2 11.8 6.7 11.8H5.5V8.8ZM6.3 9.4V11.2H6.7C6.86569 11.2 7 11.0657 7 10.9V9.7C7 9.53431 6.86569 9.4 6.7 9.4H6.3Z"
                      fill="white"
                    />
                    <path
                      d="M8.5 8.8H10.5V9.4H9.3V10.0H10.3V10.6H9.3V11.8H8.5V8.8Z"
                      fill="white"
                    />
                  </svg>
                  {isEnglish ? "PDF" : "PDF"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sm:p-1">
        {isIntersecting && (
          <Suspense fallback={<LoadingSpinner message={isEnglish ? "Loading chart..." : "ჩარტი იტვირთება..."} />}>
            {isVisible ? (
              <ReactECharts
                ref={chartRef}
                option={{
                  ...getChartOption(dateGroup),
                  series: [{
                    ...getChartOption(dateGroup).series[0],
                    label: {
                      show: true,
                      formatter: (params) => wrapText(params.name, 8, dateGroup.data.length, params.percent),
                      fontSize: 11,
                      fontFamily: 'BPG Nino Mtavruli, Arial, sans-serif',
                      overflow: 'none',
                      width: null
                    }
                  }],
                  legend: {
                    ...getChartOption(dateGroup).legend,
                    formatter: (name) => {
                      const dataItem = dateGroup.data.find(item => item.name === name);
                      if (!dataItem) return wrapText(name, 10, dateGroup.data.length);
                      
                      // Calculate percentage from the data
                      const totalValue = dateGroup.data.reduce((sum, item) => sum + item.value, 0);
                      const percentage = (dataItem.value / totalValue) * 100;
                      
                      return wrapText(name, 10, dateGroup.data.length, percentage);
                    },
                    textStyle: {
                      fontSize: 11,
                      fontFamily: 'BPG Nino Mtavruli, Arial, sans-serif',
                      overflow: 'none'
                    },
                    itemWidth: 12,
                    itemHeight: 12
                  }
                }}
                style={{ height: 400 }}
                opts={{ renderer: 'canvas' }}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
                <LoadingSpinner message={isEnglish ? "Loading chart..." : "ჩარტი იტვირთება..."} />
              </div>
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
});

ChartContainer.displayName = 'ChartContainer';
ChartContainer.propTypes = {
  dateGroup: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onToggleDropdown: PropTypes.func.isRequired,
  activeDropdown: PropTypes.number,
  isEnglish: PropTypes.bool.isRequired,
  getChartOption: PropTypes.func.isRequired,
};

export default ChartContainer;
