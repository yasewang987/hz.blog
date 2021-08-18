# python国产环境适配

## 源码编译

## rpm包制作

* 源码拷贝到主机上安装例子

```text
Name:           pyltp
Version:        0.2.1
Release:        1%{?dist}
Source0:        pyltp-0.2.1.tar.gz
Summary:        funcun  libs
License: GPLv3+
BuildArch: noarch

AutoReqProv: no

%define _binaries_in_noarch_packages_terminate_build   0

%description
funcun  libs


%prep
%setup -q

%build
%install
rm -rf %{buildroot}/funcun/libs/%{name}
mkdir  -p %{buildroot}/funcun/libs/%{name}
cp -rf $RPM_BUILD_DIR/%{name}-%{version}/*  %{buildroot}/funcun/libs/%{name}

%post
cd /funcun/libs/%{name}
python3 setup.py install

%postun
rm -rf /funcun/libs/%{name}

%clean
rm -rf %_builddir/%{name}-%{version}
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
/funcun/libs/%{name}

%changelog
```

* 编译在开发机，安装在专用机例子

```
%global buildpath /usr/local/lib/python3.7/dist-packages
%global installpath /usr/lib/python3.7/site-packages
%global pyname scipy
Name:           py-scipy
Version:        1.5.4
Release:        1%{?dist}
Source0:       scipy-1.5.4.tar.gz
Summary:        funcun libs
License: GPLv3+

%description
funcun libs


%prep
%setup -q -n %{pyname}-%{version}

%build
python3.7 setup.py install --root %{_builddir}/%{pyname}-%{version}/out
%install
rm -rf %{buildroot}%{installpath}
rm -rf %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{installpath}
mkdir -p %{buildroot}%{_bindir}
cp -rf %{_builddir}/%{pyname}-%{version}/out%{buildpath}/* %{buildroot}%{installpath}  
cp -rf %{_builddir}/%{pyname}-%{version}/out/usr/local/bin/* %{buildroot}%{_bindir}

%post

%postun

%clean
#rm -rf %_builddir/%{pyname}-%{version}
#rm -rf %{buildroot}

%files
#%defattr(-,root,root,-)
%{installpath}
%{_bindir}
```

## deb包制作