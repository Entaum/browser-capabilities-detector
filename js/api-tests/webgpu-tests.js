/**
 * WebGPU API Testing Suite
 * Comprehensive WebGPU compatibility and feature testing
 */

class WebGPUTests {
    constructor() {
        this.adapter = null;
        this.device = null;
        this.cleanupFunctions = [];
    }

    /**
     * Get all WebGPU tests
     */
    getAllTests() {
        return [
            {
                name: 'WebGPU Support',
                fn: () => this.testWebGPUSupport(),
                category: 'graphics',
                priority: 10,
                description: 'Test WebGPU availability and basic functionality'
            },
            {
                name: 'WebGPU Adapter Info',
                fn: () => this.testWebGPUAdapterInfo(),
                category: 'graphics',
                priority: 9,
                description: 'Get WebGPU adapter and hardware information',
                dependencies: ['WebGPU Support']
            },
            {
                name: 'WebGPU Device Features',
                fn: () => this.testWebGPUDeviceFeatures(),
                category: 'graphics',
                priority: 8,
                description: 'Test WebGPU device features and capabilities',
                dependencies: ['WebGPU Support']
            },
            {
                name: 'WebGPU Compute Shaders',
                fn: () => this.testWebGPUCompute(),
                category: 'graphics',
                priority: 7,
                description: 'Test WebGPU compute shader functionality',
                dependencies: ['WebGPU Support']
            },
            {
                name: 'WebGPU Rendering',
                fn: () => this.testWebGPURendering(),
                category: 'graphics',
                priority: 6,
                description: 'Test WebGPU basic rendering capabilities',
                dependencies: ['WebGPU Support']
            }
        ];
    }

    /**
     * Test WebGPU basic support and availability
     */
    async testWebGPUSupport() {
        try {
            // Check if WebGPU is available
            if (!navigator.gpu) {
                return {
                    status: 'unsupported',
                    details: 'WebGPU not available in this browser',
                    reason: 'navigator.gpu is undefined'
                };
            }

            // Request adapter
            try {
                this.adapter = await navigator.gpu.requestAdapter({
                    powerPreference: 'high-performance'
                });
            } catch (error) {
                return {
                    status: 'unsupported',
                    details: 'WebGPU adapter request failed',
                    reason: error.message
                };
            }

            if (!this.adapter) {
                return {
                    status: 'unsupported',
                    details: 'No WebGPU adapter available',
                    reason: 'requestAdapter returned null'
                };
            }

            // Request device
            try {
                this.device = await this.adapter.requestDevice();
            } catch (error) {
                return {
                    status: 'partial',
                    details: 'WebGPU adapter available but device creation failed',
                    reason: error.message
                };
            }

            if (!this.device) {
                return {
                    status: 'partial',
                    details: 'WebGPU adapter available but no device',
                    reason: 'requestDevice returned null'
                };
            }

            // Test basic device functionality
            const commandEncoder = this.device.createCommandEncoder();
            const commandBuffer = commandEncoder.finish();
            this.device.queue.submit([commandBuffer]);

            return {
                status: 'supported',
                details: 'WebGPU fully functional',
                score: 100
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGPU test failed with exception',
                error: error.message
            };
        }
    }

    /**
     * Test WebGPU adapter information and capabilities
     */
    async testWebGPUAdapterInfo() {
        try {
            if (!this.adapter) {
                return {
                    status: 'unsupported',
                    details: 'WebGPU adapter not available'
                };
            }

            const info = await this.adapter.requestAdapterInfo();
            const limits = this.adapter.limits;
            const features = Array.from(this.adapter.features);

            return {
                status: 'supported',
                details: 'WebGPU adapter information retrieved',
                adapterInfo: {
                    vendor: info.vendor || 'Unknown',
                    architecture: info.architecture || 'Unknown',
                    device: info.device || 'Unknown',
                    description: info.description || 'Unknown'
                },
                limits: {
                    maxTextureDimension1D: limits.maxTextureDimension1D,
                    maxTextureDimension2D: limits.maxTextureDimension2D,
                    maxTextureDimension3D: limits.maxTextureDimension3D,
                    maxTextureArrayLayers: limits.maxTextureArrayLayers,
                    maxBindGroups: limits.maxBindGroups,
                    maxDynamicUniformBuffersPerPipelineLayout: limits.maxDynamicUniformBuffersPerPipelineLayout,
                    maxStorageBuffersPerShaderStage: limits.maxStorageBuffersPerShaderStage,
                    maxSampledTexturesPerShaderStage: limits.maxSampledTexturesPerShaderStage,
                    maxComputeInvocationsPerWorkgroup: limits.maxComputeInvocationsPerWorkgroup,
                    maxComputeWorkgroupSizeX: limits.maxComputeWorkgroupSizeX,
                    maxComputeWorkgroupSizeY: limits.maxComputeWorkgroupSizeY,
                    maxComputeWorkgroupSizeZ: limits.maxComputeWorkgroupSizeZ,
                    maxComputeWorkgroupsPerDimension: limits.maxComputeWorkgroupsPerDimension
                },
                features,
                featureCount: features.length
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGPU adapter info test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebGPU device features and extensions
     */
    async testWebGPUDeviceFeatures() {
        try {
            if (!this.device) {
                return {
                    status: 'unsupported',
                    details: 'WebGPU device not available'
                };
            }

            const features = Array.from(this.device.features);
            const limits = this.device.limits;
            
            // Test for common features
            const commonFeatures = [
                'depth-clip-control',
                'depth32float-stencil8',
                'texture-compression-bc',
                'texture-compression-etc2',
                'texture-compression-astc',
                'timestamp-query',
                'indirect-first-instance',
                'shader-f16',
                'rg11b10ufloat-renderable',
                'bgra8unorm-storage',
                'float32-filterable'
            ];

            const featureSupport = {};
            commonFeatures.forEach(feature => {
                featureSupport[feature] = features.includes(feature);
            });

            const supportedFeatures = Object.values(featureSupport).filter(Boolean).length;
            const score = Math.round((supportedFeatures / commonFeatures.length) * 100);

            return {
                status: 'supported',
                details: `WebGPU device features: ${supportedFeatures}/${commonFeatures.length} common features`,
                features: featureSupport,
                allFeatures: features,
                limits: {
                    maxBindGroups: limits.maxBindGroups,
                    maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
                    maxUniformBufferBindingSize: limits.maxUniformBufferBindingSize,
                    maxBufferSize: limits.maxBufferSize
                },
                score
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGPU device features test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebGPU compute shader functionality
     */
    async testWebGPUCompute() {
        try {
            if (!this.device) {
                return {
                    status: 'unsupported',
                    details: 'WebGPU device not available'
                };
            }

            // Simple compute shader that squares numbers
            const computeShader = `
                @compute @workgroup_size(64)
                fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let index = global_id.x;
                    if (index >= arrayLength(&input)) {
                        return;
                    }
                    output[index] = input[index] * input[index];
                }

                @group(0) @binding(0) var<storage, read> input: array<f32>;
                @group(0) @binding(1) var<storage, read_write> output: array<f32>;
            `;

            // Create compute shader module
            const shaderModule = this.device.createShaderModule({
                code: computeShader
            });

            // Create buffers
            const inputData = new Float32Array([1, 2, 3, 4, 5]);
            const inputBuffer = this.device.createBuffer({
                size: inputData.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });

            const outputBuffer = this.device.createBuffer({
                size: inputData.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
            });

            const stagingBuffer = this.device.createBuffer({
                size: inputData.byteLength,
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
            });

            // Write input data
            this.device.queue.writeBuffer(inputBuffer, 0, inputData);

            // Create bind group layout
            const bindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: { type: 'read-only-storage' }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: { type: 'storage' }
                    }
                ]
            });

            // Create compute pipeline
            const computePipeline = this.device.createComputePipeline({
                layout: this.device.createPipelineLayout({
                    bindGroupLayouts: [bindGroupLayout]
                }),
                compute: {
                    module: shaderModule,
                    entryPoint: 'main'
                }
            });

            // Create bind group
            const bindGroup = this.device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: inputBuffer }
                    },
                    {
                        binding: 1,
                        resource: { buffer: outputBuffer }
                    }
                ]
            });

            // Dispatch compute shader
            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(Math.ceil(inputData.length / 64));
            passEncoder.end();

            // Copy result to staging buffer
            commandEncoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, inputData.byteLength);
            
            const commands = commandEncoder.finish();
            this.device.queue.submit([commands]);

            // Read results
            await stagingBuffer.mapAsync(GPUMapMode.READ);
            const resultBuffer = stagingBuffer.getMappedRange();
            const results = new Float32Array(resultBuffer);
            
            // Verify results (should be [1, 4, 9, 16, 25])
            const expected = [1, 4, 9, 16, 25];
            let correct = true;
            for (let i = 0; i < expected.length; i++) {
                if (Math.abs(results[i] - expected[i]) > 0.001) {
                    correct = false;
                    break;
                }
            }

            stagingBuffer.unmap();

            // Cleanup
            inputBuffer.destroy();
            outputBuffer.destroy();
            stagingBuffer.destroy();

            return {
                status: correct ? 'supported' : 'partial',
                details: correct ? 'WebGPU compute shaders working correctly' : 'WebGPU compute shader executed but results incorrect',
                computeResults: Array.from(results),
                expectedResults: expected,
                correct,
                score: correct ? 100 : 50
            };

        } catch (error) {
            return {
                status: 'error',
                details: 'WebGPU compute test failed',
                error: error.message
            };
        }
    }

    /**
     * Test WebGPU basic rendering functionality
     */
    async testWebGPURendering() {
        try {
            if (!this.device) {
                return {
                    status: 'unsupported',
                    details: 'WebGPU device not available'
                };
            }

            // Create a canvas for rendering test
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            const context = canvas.getContext('webgpu');
            if (!context) {
                canvas.remove();
                return {
                    status: 'partial',
                    details: 'WebGPU device available but canvas context creation failed'
                };
            }

            const format = navigator.gpu.getPreferredCanvasFormat();
            context.configure({
                device: this.device,
                format: format
            });

            // Simple vertex shader
            const vertexShader = `
                @vertex
                fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
                    var pos = array<vec2<f32>, 3>(
                        vec2<f32>( 0.0,  0.5),
                        vec2<f32>(-0.5, -0.5),
                        vec2<f32>( 0.5, -0.5)
                    );
                    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                }
            `;

            // Simple fragment shader
            const fragmentShader = `
                @fragment
                fn main() -> @location(0) vec4<f32> {
                    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
                }
            `;

            // Create shader modules
            const vertexModule = this.device.createShaderModule({ code: vertexShader });
            const fragmentModule = this.device.createShaderModule({ code: fragmentShader });

            // Create render pipeline
            const pipeline = this.device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: vertexModule,
                    entryPoint: 'main'
                },
                fragment: {
                    module: fragmentModule,
                    entryPoint: 'main',
                    targets: [{ format: format }]
                },
                primitive: {
                    topology: 'triangle-list'
                }
            });

            // Render a frame
            const commandEncoder = this.device.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();
            
            const renderPassDescriptor = {
                colorAttachments: [{
                    view: textureView,
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }]
            };

            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.setPipeline(pipeline);
            passEncoder.draw(3);
            passEncoder.end();

            this.device.queue.submit([commandEncoder.finish()]);

            // Cleanup
            canvas.remove();

            return {
                status: 'supported',
                details: 'WebGPU rendering test successful',
                canvasFormat: format,
                score: 100
            };

        } catch (error) {
            // Cleanup canvas if it exists
            const canvas = document.querySelector('canvas[style*="display: none"]');
            if (canvas) canvas.remove();
            
            return {
                status: 'error',
                details: 'WebGPU rendering test failed',
                error: error.message
            };
        }
    }

    /**
     * Cleanup WebGPU resources
     */
    cleanup() {
        if (this.device) {
            this.device.destroy();
            this.device = null;
        }
        this.adapter = null;

        // Execute any registered cleanup functions
        this.cleanupFunctions.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.warn('WebGPU cleanup function error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebGPUTests;
} else {
    window.WebGPUTests = WebGPUTests;
}