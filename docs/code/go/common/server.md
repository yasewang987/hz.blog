# 服务器信息获取

## 安装依赖项

```bash
go get github.com/shirou/gopsutil
```

## 使用示例

```go
package node

import (
	"fmt"
	"time"

	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/disk"
	"github.com/shirou/gopsutil/mem"
	"github.com/shirou/gopsutil/net"
)

// cpu信息
type CpuInfo struct {
	// 物理核心数
	Cores int `json:"cores"`
	// 逻辑核心数 = 线程数
	Count   int     `json:"count"`
	Percent float64 `json:"percent"`
}

// 获取cpu信息
func GetCpuInfo() (CpuInfo, error) {
	cpuInfo := CpuInfo{}

  // 采集更加全面的信息使用 
  // cpu.Info()
	// 逻辑核心数
	cpuCount, err := cpu.Counts(true)
	if err != nil {
		return cpuInfo, err
	}
	cpuInfo.Count = cpuCount
  // 物理核心数
	cores, err := cpu.Counts(false)
	if err != nil {
		return cpuInfo, err
	}
	cpuInfo.Cores = cores

	c, err := cpu.Percent(time.Duration(time.Second), false)

	if len(c) > 0 {
		cpuInfo.Percent = c[0]
	}

	return cpuInfo, err
}

// 内存信息
type MemoryInfo struct {
	Total       string `json:"total"`
	Available   string `json:"available"`
	Used        string `json:"used"`
	UsedPercent string `json:"usedPercent"`
}

const toM float64 = 1024 * 1024
const toG float64 = toM * 1024

// 获取内存信息
func GetMemoryInfo() (MemoryInfo, error) {
	memoryInfo := MemoryInfo{}
	m, err := mem.VirtualMemory()
	if err != nil {
		return memoryInfo, err
	}
	memoryInfo.Total = fmt.Sprintf("%.2fG", float64(m.Total)/toG)
	memoryInfo.Used = fmt.Sprintf("%.2fG", float64(m.Used)/toG)
	memoryInfo.Available = fmt.Sprintf("%.2fG", float64(m.Available)/toG)
	memoryInfo.UsedPercent = fmt.Sprintf("%.2f", m.UsedPercent)

	return memoryInfo, nil
}

// 磁盘信息
type DiskInfo struct {
	Total       string `json:"total"`
	Free        string `json:"free"`
	Used        string `json:"used"`
	UsedPercent string `json:"usedPercent"`
}

// 获取磁盘信息
func GetDiskInfo() (DiskInfo, error) {
	diskInfo := DiskInfo{}
	d, err := disk.Usage("/")
	if err != nil {
		return diskInfo, err
	}
	diskInfo.Total = fmt.Sprintf("%.2fG", float64(d.Total)/toG)
	diskInfo.Free = fmt.Sprintf("%.2fG", float64(d.Free)/toG)
	diskInfo.Used = fmt.Sprintf("%.2fG", float64(d.Used)/toG)
	diskInfo.UsedPercent = fmt.Sprintf("%.2f", d.UsedPercent)
	return diskInfo, nil
}

// 网络信息
type NetInfo struct {
	Name string `json:"name"`
	Sent string `json:"sent"`
	Recv string `json:"recv"`
}

// 获取网络信息
func GetNetsInfo() (NetInfo, error) {
	netinfo := NetInfo{}
	ns, err := net.IOCounters(false)
	if err != nil {
		return netinfo, err
	}
	netinfo.Name = ns[0].Name
	netinfo.Sent = fmt.Sprintf("%.2fM", float64(ns[0].BytesSent)/toM)
	netinfo.Recv = fmt.Sprintf("%.2fM", float64(ns[0].BytesRecv)/toM)
	return netinfo, nil
}

// 获取ip地址
func GetLocalIP() (ip string, err error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return
	}
	for _, addr := range addrs {
		ipAddr, ok := addr.(*net.IPNet)
		if !ok {
			continue
		}
		if ipAddr.IP.IsLoopback() {
			continue
		}
		if !ipAddr.IP.IsGlobalUnicast() {
			continue
		}
		return ipAddr.IP.String(), nil
	}
	return
}
```