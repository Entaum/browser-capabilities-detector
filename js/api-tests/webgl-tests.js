/**
 * WebGL API Testing Suite
 * Comprehensive WebGL 1.0 and 2.0 compatibility testing
 */

class WebGLTests {
    constructor() {
        this.canvas = null;
        this.cleanupFunctions = [];
    }

    /**
     * Get all WebGL tests
     */
    getAllTests() {
        return [
            {
                name: 'WebGL 1.0 Support',
                fn: () => this.testWebGL1Support(),
                category: 'graphics',
                priority: 10,
                description: 'Test WebGL 1.0 context creation and basic functionality'
            },
            {
                name: 'WebGL 2.0 Support',
                fn: () => this.testWebGL2Support(),
                category: 'graphics',
                priority: 9,
                description: 'Test WebGL 2.0 context creation and advanced features'
            },
            {
                name: 'WebGL Extensions',
                fn: () => this.testWebGLExtensions(),
                category: 'graphics',
                priority: 7,
                description: 'Test availability of common WebGL extensions',
                dependencies: ['WebGL 1.0 Support']
            },
            {
                name: 'WebGL Performance',
                fn: () => this.testWebGLPerformance(),
                category: 'graphics',
                priority: 6,
                description: 'Test WebGL rendering performance capabilities',
                dependencies: ['WebGL 1.0 Support']
            },
            {
                name: 'WebGL Hardware Info',
                fn: () => this.testWebGLHardwareInfo(),
                category: 'graphics',
                priority: 8,
                description: 'Get WebGL renderer and hardware information',
                dependencies: ['WebGL 1.0 Support']
            }
        ];
    }

    /**
     * Test WebGL 1.0 support and basic functionality
     */
    async testWebGL1Support() {
        try {
            const canvas = this.createCanvas();
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return {
                    status: 'unsupported',
                    details: 'WebGL 1.0 context creation failed',
                    reason: 'Browser does not support WebGL 1.0'
                };
            }

            // Test basic WebGL functionality
            const capabilities = {
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
                aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
            };

            // Test basic operations
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Check for any GL errors
            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                return {
                    status: 'partial',
                    details: 'WebGL 1.0 context created but basic operations failed',
                    capabilities,
                    error: `GL Error: ${error}`
                };
            }

            return {
                status: 'supported',
                details: 'WebGL 1.0 fully functional',
                capabilities,
                score: 100
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGL 1.0 test failed with exception',
                error: error.message
            };
        } finally {
            this.cleanup();
        }
    }

    /**
     * Test WebGL 2.0 support and advanced features
     */
    async testWebGL2Support() {
        try {
            const canvas = this.createCanvas();
            const gl2 = canvas.getContext('webgl2');
            
            if (!gl2) {
                return {
                    status: 'unsupported',
                    details: 'WebGL 2.0 context creation failed',
                    reason: 'Browser does not support WebGL 2.0'
                };
            }

            // Test WebGL 2.0 specific features
            const capabilities = {
                version: gl2.getParameter(gl2.VERSION),
                shadingLanguageVersion: gl2.getParameter(gl2.SHADING_LANGUAGE_VERSION),
                maxColorAttachments: gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS),
                maxDrawBuffers: gl2.getParameter(gl2.MAX_DRAW_BUFFERS),
                maxSamples: gl2.getParameter(gl2.MAX_SAMPLES),
                max3DTextureSize: gl2.getParameter(gl2.MAX_3D_TEXTURE_SIZE),
                maxArrayTextureLayers: gl2.getParameter(gl2.MAX_ARRAY_TEXTURE_LAYERS),
                maxVertexOutputComponents: gl2.getParameter(gl2.MAX_VERTEX_OUTPUT_COMPONENTS),
                maxFragmentInputComponents: gl2.getParameter(gl2.MAX_FRAGMENT_INPUT_COMPONENTS)
            };

            // Test WebGL 2.0 specific functionality
            const features = {
                transformFeedback: typeof gl2.createTransformFeedback === 'function',
                vertexArrayObjects: typeof gl2.createVertexArray === 'function',
                samplerObjects: typeof gl2.createSampler === 'function',
                uniformBufferObjects: typeof gl2.getUniformBlockIndex === 'function',
                multipleRenderTargets: gl2.getParameter(gl2.MAX_DRAW_BUFFERS) > 1,
                instancing: typeof gl2.drawArraysInstanced === 'function',
                texture3D: typeof gl2.texImage3D === 'function'
            };

            // Test a simple WebGL 2.0 operation
            const vao = gl2.createVertexArray();
            if (!vao) {
                return {
                    status: 'partial',
                    details: 'WebGL 2.0 context created but VAO creation failed',
                    capabilities,
                    features
                };
            }

            gl2.deleteVertexArray(vao);

            const supportedFeatures = Object.values(features).filter(Boolean).length;
            const totalFeatures = Object.keys(features).length;
            const score = Math.round((supportedFeatures / totalFeatures) * 100);

            return {
                status: score > 80 ? 'supported' : 'partial',
                details: `WebGL 2.0 functional with ${supportedFeatures}/${totalFeatures} features`,
                capabilities,
                features,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGL 2.0 test failed with exception',
                error: error.message
            };
        } finally {
            this.cleanup();
        }
    }

    /**
     * Test WebGL extensions availability
     */
    async testWebGLExtensions() {
        try {
            const canvas = this.createCanvas();
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return {
                    status: 'unsupported',
                    details: 'WebGL not available for extension testing'
                };
            }

            const commonExtensions = [
                'OES_texture_float',
                'OES_texture_half_float',
                'WEBGL_depth_texture',
                'OES_standard_derivatives',
                'OES_vertex_array_object',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_pvrtc',
                'WEBGL_compressed_texture_etc1',
                'EXT_texture_filter_anisotropic',
                'WEBGL_draw_buffers',
                'ANGLE_instanced_arrays',
                'OES_element_index_uint',
                'EXT_blend_minmax',
                'EXT_shader_texture_lod',
                'WEBGL_lose_context',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders'
            ];

            const availableExtensions = gl.getSupportedExtensions() || [];
            const extensionStatus = {};
            
            commonExtensions.forEach(ext => {
                extensionStatus[ext] = {
                    supported: availableExtensions.includes(ext),
                    extension: availableExtensions.includes(ext) ? gl.getExtension(ext) : null
                };
            });

            const supportedCount = Object.values(extensionStatus).filter(ext => ext.supported).length;
            const totalCount = commonExtensions.length;
            const score = Math.round((supportedCount / totalCount) * 100);

            let status;
            if (score >= 70) {
                status = 'supported';
            } else if (score >= 30) {
                status = 'partial';
            } else if (score > 0) {
                status = 'partial';
            } else {
                status = 'unsupported';
            }

            return {
                status,
                details: `${supportedCount}/${totalCount} common extensions supported`,
                extensions: extensionStatus,
                availableExtensions,
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGL extensions test failed',
                error: error.message
            };
        } finally {
            this.cleanup();
        }
    }

    /**
     * Test WebGL rendering performance
     */
    async testWebGLPerformance() {
        try {
            const canvas = this.createCanvas();
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return {
                    status: 'unsupported',
                    details: 'WebGL not available for performance testing'
                };
            }

            // Simple performance test - triangle rendering
            const vertexShaderSource = `
                attribute vec2 a_position;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            `;

            const fragmentShaderSource = `
                precision mediump float;
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
            `;

            const program = this.createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
            if (!program) {
                return {
                    status: 'partial',
                    details: 'WebGL shader program creation failed',
                    reason: 'Unable to create basic shader program'
                };
            }

            // Performance test - measure draw calls per second
            const startTime = performance.now();
            const testDuration = 100; // 100ms test
            let drawCalls = 0;

            const vertices = new Float32Array([
                -0.5, -0.5,
                 0.5, -0.5,
                 0.0,  0.5
            ]);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            gl.useProgram(program);
            gl.viewport(0, 0, canvas.width, canvas.height);

            // Render loop for performance testing
            while (performance.now() - startTime < testDuration) {
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                drawCalls++;
            }

            const actualDuration = performance.now() - startTime;
            const drawCallsPerSecond = Math.round((drawCalls / actualDuration) * 1000);

            // Determine performance rating
            let performanceRating;
            let score;
            if (drawCallsPerSecond > 1000) {
                performanceRating = 'excellent';
                score = 100;
            } else if (drawCallsPerSecond > 500) {
                performanceRating = 'good';
                score = 80;
            } else if (drawCallsPerSecond > 100) {
                performanceRating = 'fair';
                score = 60;
            } else {
                performanceRating = 'poor';
                score = 30;
            }

            return {
                status: 'supported',
                details: `WebGL performance: ${performanceRating}`,
                performance: {
                    drawCallsPerSecond,
                    testDuration: actualDuration,
                    totalDrawCalls: drawCalls,
                    rating: performanceRating
                },
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGL performance test failed',
                error: error.message
            };
        } finally {
            this.cleanup();
        }
    }

    /**
     * Get WebGL hardware and driver information
     */
    async testWebGLHardwareInfo() {
        try {
            const canvas = this.createCanvas();
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return {
                    status: 'unsupported',
                    details: 'WebGL not available for hardware info'
                };
            }

            // Get debug renderer info extension for more detailed hardware info
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            
            const info = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Not available',
                unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Not available'
            };

            // Detect GPU vendor
            let gpuVendor = 'unknown';
            const renderer = info.unmaskedRenderer.toLowerCase();
            if (renderer.includes('nvidia') || renderer.includes('geforce') || renderer.includes('quadro')) {
                gpuVendor = 'NVIDIA';
            } else if (renderer.includes('amd') || renderer.includes('radeon') || renderer.includes('ati')) {
                gpuVendor = 'AMD';
            } else if (renderer.includes('intel') || renderer.includes('hd graphics') || renderer.includes('iris')) {
                gpuVendor = 'Intel';
            } else if (renderer.includes('apple') || renderer.includes('m1') || renderer.includes('m2')) {
                gpuVendor = 'Apple';
            }

            return {
                status: 'supported',
                details: 'WebGL hardware information retrieved',
                hardware: {
                    ...info,
                    gpuVendor,
                    debugInfoAvailable: !!debugInfo
                }
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGL hardware info test failed',
                error: error.message
            };
        } finally {
            this.cleanup();
        }
    }

    /**
     * Helper method to create a canvas element
     */
    createCanvas() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 256;
            this.canvas.height = 256;
            this.canvas.style.display = 'none';
            document.body.appendChild(this.canvas);
        }
        return this.canvas;
    }

    /**
     * Helper method to create WebGL shader program
     */
    createShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
        try {
            const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
            const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
            
            if (!vertexShader || !fragmentShader) {
                return null;
            }

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('WebGL program link error:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }

            return program;
        } catch (error) {
            console.error('Error creating shader program:', error);
            return null;
        }
    }

    /**
     * Helper method to create WebGL shader
     */
    createShader(gl, type, source) {
        try {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('WebGL shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        } catch (error) {
            console.error('Error creating shader:', error);
            return null;
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null;
        }
        
        // Execute any registered cleanup functions
        this.cleanupFunctions.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.warn('Cleanup function error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebGLTests;
} else {
    window.WebGLTests = WebGLTests;
}